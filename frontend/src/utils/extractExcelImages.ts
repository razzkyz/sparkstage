import * as JSZip from 'jszip';

export interface EmbeddedImage {
  blob: Blob;
  filename: string;
  mimeType: string;
  colIndex: number;
}

/**
 * Extracts embedded images from an Excel (.xlsx) file and maps them to their 
 * row index (0-based, where 0 is the first row).
 * 
 * @param file The Excel file
 * @returns A Map where the key is the row index and the value is an array of images in that row.
 */
export async function extractExcelImages(file: File): Promise<Map<number, EmbeddedImage[]>> {
  const imageMap = new Map<number, EmbeddedImage[]>();
  
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    return imageMap; // Only .xlsx files are supported (ZIP format)
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // 1. Check if drawings exist
    const drawingFiles = Object.keys(zip.files).filter(name => name.startsWith('xl/drawings/drawing') && name.endsWith('.xml'));
    if (drawingFiles.length === 0) {
      return imageMap;
    }

    // We process each drawing file (usually just drawing1.xml for the first sheet)
    for (const drawingFile of drawingFiles) {
      const drawingXmlText = await zip.files[drawingFile].async('text');
      
      // Get the corresponding .rels file for this drawing
      // e.g., xl/drawings/drawing1.xml -> xl/drawings/_rels/drawing1.xml.rels
      const relsFileName = drawingFile.replace('xl/drawings/', 'xl/drawings/_rels/') + '.rels';
      const relsFile = zip.files[relsFileName];
      
      if (!relsFile) continue;
      
      const relsXmlText = await relsFile.async('text');
      
      // Parse XMLs
      const parser = new DOMParser();
      const drawingDoc = parser.parseFromString(drawingXmlText, 'text/xml');
      const relsDoc = parser.parseFromString(relsXmlText, 'text/xml');
      
      // Build relations map: rId -> target (e.g., rId1 -> ../media/image1.png)
      const relMap = new Map<string, string>();
      const relationships = relsDoc.getElementsByTagName('Relationship');
      for (let i = 0; i < relationships.length; i++) {
        const id = relationships[i].getAttribute('Id');
        const target = relationships[i].getAttribute('Target'); // e.g., ../media/image1.png
        if (id && target) {
          // Resolve relative path. If drawing is in xl/drawings/, target is ../media/image1.png
          // So the absolute path in ZIP is xl/media/image1.png
          const absolutePath = target.replace('../', 'xl/');
          relMap.set(id, absolutePath);
        }
      }

      // Find all image anchors (either twoCellAnchor or oneCellAnchor)
      const anchors = Array.from(drawingDoc.getElementsByTagName('*')).filter(el => 
        el.tagName.includes('twoCellAnchor') || el.tagName.includes('oneCellAnchor')
      );
      
      for (const anchor of anchors) {
        // Find the 'from' element to get the row, handling different namespace representations
        let fromEl = Array.from(anchor.getElementsByTagName('*')).find(el => el.localName === 'from' || el.tagName.endsWith(':from') || el.tagName === 'from');
        if (!fromEl) continue;
        
        let rowEl = Array.from(fromEl.getElementsByTagName('*')).find(el => el.localName === 'row' || el.tagName.endsWith(':row') || el.tagName === 'row');
        if (!rowEl || !rowEl.textContent) continue;
        
        const rowIndex = parseInt(rowEl.textContent, 10);
        if (isNaN(rowIndex)) continue;

        let colEl = Array.from(fromEl.getElementsByTagName('*')).find(el => el.localName === 'col' || el.tagName.endsWith(':col') || el.tagName === 'col');
        const colIndex = colEl && colEl.textContent ? parseInt(colEl.textContent, 10) : 0;

        // Find the blip element which contains the embed id
        let blipEl = Array.from(anchor.getElementsByTagName('*')).find(el => el.localName === 'blip' || el.tagName.endsWith(':blip') || el.tagName === 'blip');
        if (!blipEl) continue;
        
        const embedId = blipEl.getAttribute('r:embed') 
          || blipEl.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed')
          || blipEl.getAttribute('embed');
        if (!embedId) continue;
        
        const imagePath = relMap.get(embedId);
        if (!imagePath) continue;
        
        const imageFile = zip.files[imagePath];
        if (!imageFile) continue;
        
        // Determine mime type from extension
        let mimeType = 'image/png';
        const lowerPath = imagePath.toLowerCase();
        if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (lowerPath.endsWith('.webp')) mimeType = 'image/webp';
        else if (lowerPath.endsWith('.gif')) mimeType = 'image/gif';
        
        const filename = imagePath.split('/').pop() || `image_${rowIndex}.png`;
        
        // Extract blob
        const blob = await imageFile.async('blob');
        const finalBlob = new Blob([blob], { type: mimeType });
        
        const embeddedImage: EmbeddedImage = {
          blob: finalBlob,
          filename,
          mimeType,
          colIndex
        };
        
        if (!imageMap.has(rowIndex)) {
          imageMap.set(rowIndex, []);
        }
        imageMap.get(rowIndex)!.push(embeddedImage);
      }
    }
    
    // Sort images within each row by colIndex to ensure left-to-right ordering
    for (const [_rowIndex, images] of imageMap.entries()) {
      images.sort((a, b) => a.colIndex - b.colIndex);
    }
    
    return imageMap;
  } catch (err) {
    console.error('Error extracting images from Excel:', err);
    return imageMap;
  }
}
