import { useState, useEffect } from "react";
import { useProfile } from "../../hooks/useProfile";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  User,
  Phone,
  AlertCircle,
  CheckCircle,
  Mail,
  Info,
} from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const { profile, isLoading, updateProfile, isUpdating } = useProfile();

  // --- Profile form state ---
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    province_id: "",
    city_id: "",
    subdistrict_id: "",
    postal_code: "",
  });
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- Email change state ---
  const [newEmail, setNewEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);



  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        province_id: profile.province_id || "",
        city_id: profile.city_id || "",
        subdistrict_id: profile.subdistrict_id || "",
        postal_code: profile.postal_code || "",
      });
    }
  }, [profile]);



  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      await updateProfile(formData);
      setProfileMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to update profile";
      setProfileMessage({ type: "error", text: msg });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail === user?.email) {
      setEmailMessage({
        type: "error",
        text: "Please enter a different email address.",
      });
      return;
    }
    setIsChangingEmail(true);
    setEmailMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setEmailMessage({
        type: "info",
        text: `Confirmation email sent to ${newEmail}. Please check your inbox and click the link to confirm the change. Your email won't change until you verify the new address.`,
      });
      setNewEmail("");
      setShowEmailForm(false);
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Failed to update email";
      setEmailMessage({ type: "error", text: msg });
    } finally {
      setIsChangingEmail(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 max-w-[800px] mx-auto flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[800px] mx-auto">
      <div className="mb-7">
        <h1 className="text-4xl font-black text-pink-600 mb-1.5">My Profile</h1>
        <p className="text-gray-500 text-[0.95rem]">
          Manage your personal information and account settings
        </p>
      </div>

      {/* ── Email Settings Card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl py-7 px-8 shadow-sm mb-6">
        <div className="flex items-center gap-2.5 text-pink-600 mb-5">
          <Mail size={20} />
          <h2 className="text-[1.1rem] font-bold text-gray-900 m-0">
            Email Address
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-4 bg-gray-50 border border-gray-200 rounded-lg gap-3 sm:gap-0">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Current email
            </span>
            <span className="text-base font-semibold text-gray-900">
              {user?.email || "—"}
            </span>
          </div>
          {!showEmailForm && (
            <button
              type="button"
              className="py-2 px-4 border-[1.5px] border-pink-600 text-pink-600 rounded-md text-[0.85rem] font-semibold bg-white transition-colors duration-150 hover:bg-pink-600 hover:text-white whitespace-nowrap"
              onClick={() => {
                setShowEmailForm(true);
                setEmailMessage(null);
              }}
            >
              Change Email
            </button>
          )}
        </div>

        {emailMessage && (
          <div
            className={`flex items-start gap-3 py-3.5 px-4 rounded-lg text-[0.9rem] font-medium leading-relaxed mt-4 ${
              emailMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : emailMessage.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            {emailMessage.type === "success" && (
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
            )}
            {emailMessage.type === "error" && (
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
            )}
            {emailMessage.type === "info" && (
              <Info size={18} className="shrink-0 mt-0.5" />
            )}
            <span>{emailMessage.text}</span>
          </div>
        )}

        {showEmailForm && (
          <form
            onSubmit={handleEmailChange}
            className="mt-5 flex flex-col gap-4"
          >
            <div className="hidden items-start gap-2 py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg text-[0.85rem] text-blue-800 leading-relaxed">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>
                A confirmation link will be sent to your new email. Your email
                won't change until you click the link.
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="new-email"
                className="text-[0.8rem] font-semibold text-gray-700 uppercase tracking-wide"
              >
                New Email Address
              </label>
              <div className="relative flex items-center">
                <Mail
                  className="absolute left-3.5 text-gray-400 pointer-events-none"
                  size={18}
                />
                <input
                  type="email"
                  id="new-email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  required
                  className="w-full py-[0.7rem] pr-3.5 pl-11 border border-gray-300 rounded-lg text-[0.95rem] text-gray-900 bg-gray-50 transition-colors duration-150 focus:outline-none focus:border-pink-600 focus:bg-white focus:ring-[3px] focus:ring-pink-600/10"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="py-[0.8rem] px-5 border-[1.5px] border-gray-300 text-gray-500 rounded-lg text-[0.95rem] font-semibold bg-white cursor-pointer transition-colors duration-150 hover:border-gray-400 hover:text-gray-700"
                onClick={() => {
                  setShowEmailForm(false);
                  setNewEmail("");
                  setEmailMessage(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isChangingEmail}
                className="bg-pink-600 text-white border-none py-[0.8rem] px-7 rounded-lg font-semibold text-[0.95rem] cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(79,70,229,0.2)] hover:opacity-90 hover:-translate-y-[1px] disabled:opacity-65 disabled:cursor-not-allowed"
              >
                {isChangingEmail
                  ? "Sending confirmation..."
                  : "Send Confirmation"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Profile Info Card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl py-7 px-8 shadow-sm mb-6">
        {profileMessage && (
          <div
            className={`flex items-start gap-3 py-3.5 px-4 rounded-lg text-[0.9rem] font-medium leading-relaxed mb-6 ${
              profileMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {profileMessage.type === "success" ? (
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
            )}
            <span>{profileMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="flex flex-col gap-0">
          {/* Personal Information */}
          <div className="mb-2">
            <div className="flex items-center gap-2.5 text-pink-600 mb-5">
              <User size={20} />
              <h2 className="text-[1.1rem] font-bold text-gray-900 m-0">
                Personal Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name"
                  className="text-[0.8rem] font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full py-[0.7rem] pr-3.5 pl-11 border border-gray-300 rounded-lg text-[0.95rem] text-gray-900 bg-gray-50 transition-colors duration-150 focus:outline-none focus:border-pink-600 focus:bg-white focus:ring-[3px] focus:ring-pink-600/10"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="phone"
                  className="text-[0.8rem] font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Phone Number (WhatsApp)
                </label>
                <div className="relative flex items-center">
                  <Phone
                    className="absolute left-3.5 text-gray-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setFormData((prev) => ({ ...prev, phone: val }));
                    }}
                    placeholder="e.g. 08123456789"
                    className={`w-full py-[0.7rem] pr-3.5 pl-11 border rounded-lg text-[0.95rem] text-gray-900 bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-white focus:ring-[3px] ${
                      formData.phone && !/^08[0-9]{8,11}$/.test(formData.phone)
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                        : "border-gray-300 focus:border-pink-600 focus:ring-pink-600/10"
                    }`}
                  />
                </div>
                {formData.phone && !/^08[0-9]{8,11}$/.test(formData.phone) && (
                  <span className="text-red-500 text-[0.8rem] mt-0.5">
                    Format nomor telepon salah (harus diawali 08 dan 10-13
                    digit)
                  </span>
                )}
              </div>
            </div>
          </div>



          <div className="flex gap-3 justify-end mt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="bg-pink-600 text-white border-none py-[0.8rem] px-7 rounded-lg font-semibold text-[0.95rem] cursor-pointer transition-all duration-200 shadow-[0_4px_6px_-1px_rgba(79,70,229,0.2)] hover:opacity-90 hover:-translate-y-[1px] disabled:opacity-65 disabled:cursor-not-allowed"
            >
              {isUpdating ? "Saving Changes..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
