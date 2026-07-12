import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import QRScannerModal from '../../components/admin/QRScannerModal';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_MENU_ITEMS } from '../../constants/adminMenu';
import { useProductOrders } from '../../hooks/useProductOrders';
import { useToast } from '../../components/Toast';
import { ProductOrderDetailsModal } from './product-orders/ProductOrderDetailsModal';
import { ProductOrdersListSection } from './product-orders/ProductOrdersListSection';
import { ProductOrdersLookupPanel } from './product-orders/ProductOrdersLookupPanel';
import { useProductOrdersController } from './product-orders/useProductOrdersController';
import { useThermalPrinter } from '../../hooks/useThermalPrinter';
import { generatePickupReceipt } from '../../utils/receiptGenerator';

export default function ProductOrders() {
  const { signOut, session } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [scanSequenceNumber, setScanSequenceNumber] = useState<string | undefined>(undefined);
  const [scanDescription, setScanDescription] = useState<string | undefined>(undefined);

  const { data, error, isLoading, isFetching, refetch } = useProductOrders();
  const orders = data?.orders ?? [];
  const pendingPickupCount = data?.pendingPickupCount ?? 0;
  const pendingPaymentCount = data?.pendingPaymentCount ?? 0;
  const ordersError = error instanceof Error ? error.message : error ? 'Gagal memuat daftar pesanan' : null;
  const controller = useProductOrdersController({
    orders,
    pendingPickupCount,
    pendingPaymentCount,
    ordersError,
    session,
    showToast,
  });
  
  const { isConnected, isPrinting, connectionType, connectUSB, connectBluetooth, disconnect, print } = useThermalPrinter();
  const {
    activeTab,
    scannerOpen,
    lookupCode,
    lookupError,
    details,
    submitting,
    actionError,
    inputRef,
    pendingOrders,
    pendingPaymentOrders,
    todaysOrders,
    completedOrders,
    displayOrders,
    menuSections,
    selectedBatchCodes,
    isBatchSubmitting,
    setActiveTab,
    setScannerOpen,
    setLookupCode,
    handleLookup,
    handleScan,
    handleSelectOrder,
    handleCloseDetails,
    handleCompletePickup,
    toggleBatchCode,
    handleBatchCompletePickup,
  } = controller;

  const handleScanWithDetails = useCallback(
    async (decodedText: string) => {
      setScanSequenceNumber(undefined);
      setScanDescription(undefined);
      await handleScan(decodedText);
      if (details) {
        setScanSequenceNumber(details.order.pickup_code || undefined);
        setScanDescription(`${details.order.profiles?.name || 'Unknown'} - ${details.items.length} item(s)`);
      }
    },
    [handleScan, details]
  );

  const handlePrintReceipt = async () => {
    if (!details || !isConnected) return;
    try {
      const receiptData = generatePickupReceipt({
        orderCode: details.order.pickup_code || '',
        date: new Date().toLocaleString('id-ID'),
        customerName: details.order.profiles?.name || details.order.profiles?.email || 'Customer',
        items: details.items.map(i => ({
          name: i.productName,
          variant: i.variantName || '',
          price: i.price,
          subtotal: i.subtotal,
          qty: i.quantity
        })),
        total: Number(details.order.total || 0)
      });
      await print(receiptData);
      showToast('success', 'Struk berhasil dikirim ke printer');
    } catch (e: any) {
      console.error(e);
      showToast('error', 'Gagal mencetak struk: ' + (e.message || ''));
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pickupCode = params.get('pickupCode')?.trim().toUpperCase();
    if (!pickupCode) return;

    setLookupCode(pickupCode);
    void handleSelectOrder(pickupCode);

    params.delete('pickupCode');
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true }
    );
  }, [handleSelectOrder, location.pathname, location.search, navigate, setLookupCode]);

  return (
    <AdminLayout
      menuItems={ADMIN_MENU_ITEMS}
      menuSections={menuSections}
      defaultActiveMenuId="product-orders"
      title="Pesanan Produk"
      subtitle="Scan pickup code untuk verifikasi barang."
      headerActions={
        <div className="flex gap-2">
          {isConnected ? (
            <button
              onClick={disconnect}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-3 md:px-4 py-2.5 text-sm font-bold text-white hover:bg-green-600 transition-colors shadow-md"
              title={`Printer terhubung via ${connectionType}`}
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
              <span className="hidden sm:inline">Printer OK</span>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={connectUSB}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors shadow-sm"
                title="Hubungkan Printer USB"
              >
                <span className="material-symbols-outlined text-[20px]">usb</span>
              </button>
              <button
                onClick={connectBluetooth}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-100 border border-blue-300 px-3 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-200 transition-colors shadow-sm"
                title="Hubungkan Printer Bluetooth"
              >
                <span className="material-symbols-outlined text-[20px]">bluetooth</span>
              </button>
            </div>
          )}
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#ff4b86] px-3 md:px-4 py-2.5 text-sm font-bold text-white hover:bg-[#ff6a9a] transition-colors shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            <span className="hidden sm:inline">Scan QR</span>
          </button>
        </div>
      }
      onLogout={signOut}
    >
      <ProductOrdersLookupPanel
        inputRef={inputRef}
        lookupCode={lookupCode}
        lookupError={lookupError}
        onChangeCode={setLookupCode}
        onLookup={() => {
          void handleLookup();
        }}
      />

      <ProductOrdersListSection
        activeTab={activeTab}
        pendingPickupCount={pendingOrders.length}
        pendingPaymentCount={pendingPaymentOrders.length}
        todayCount={todaysOrders.length}
        completedCount={completedOrders.length}
        isLoading={isLoading}
        isFetching={isFetching}
        ordersError={ordersError}
        displayOrders={displayOrders}
        selectedBatchCodes={selectedBatchCodes}
        isBatchSubmitting={isBatchSubmitting}
        onChangeTab={setActiveTab}
        onRefresh={() => {
          void refetch();
        }}
        onSelectOrder={(pickupCode) => {
          void handleSelectOrder(pickupCode);
        }}
        onToggleBatchCode={toggleBatchCode}
        onBatchComplete={() => {
          void handleBatchCompletePickup();
        }}
      />

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        title="Scan Pickup QR"
        onScan={handleScanWithDetails}
        closeOnSuccess={false}
        closeOnError={false}
        autoResumeAfterMs={3000}
        sequenceNumber={scanSequenceNumber}
        description={scanDescription}
      />

      <ProductOrderDetailsModal
        details={details}
        submitting={submitting}
        actionError={actionError}
        onClose={handleCloseDetails}
        onCompletePickup={() => {
          void handleCompletePickup();
        }}
        isConnected={isConnected}
        isPrinting={isPrinting}
        onPrintReceipt={() => { void handlePrintReceipt(); }}
      />
    </AdminLayout>
  );
}
