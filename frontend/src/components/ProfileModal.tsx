import { useRef, useState } from "react";
import { api } from "../services/api";
import { toast } from "react-toastify";

export default function ProfileModal({
  currentUser,
  onClose,
  onUpdate,
}: {
  currentUser: any;
  onClose: () => void;
  onUpdate: (user: any) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profilePic", file);

      const res = await api.post("/users/upload-profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUpdate(res.data.user);
      toast.success("Profile picture updated!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setUploading(true);
      const res = await api.delete("/users/remove-profile-pic");
      onUpdate(res.data.user);
      toast.success("Profile picture removed!");
    } catch (err: any) {
      toast.error("Failed to remove picture");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-[#202c33] rounded-t-2xl sm:rounded-xl p-6 w-full sm:w-96 sm:max-w-sm flex flex-col items-center gap-5">

        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <p className="text-white font-semibold text-lg">Profile</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a3942] text-[#8696a0] hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Avatar */}
        <div className="relative">
          {currentUser?.profilePic ? (
            <img
              src={currentUser.profilePic}
              alt="profile"
              className="w-28 h-28 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-[#00a884]"
            />
          ) : (
            <div className="w-28 h-28 sm:w-24 sm:h-24 rounded-full bg-[#00a884] flex items-center justify-center text-white text-4xl sm:text-3xl font-bold uppercase border-4 border-[#00a884]">
              {currentUser?.username?.[0]}
            </div>
          )}

          {/* Camera button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-9 h-9 bg-[#00a884] rounded-full flex items-center justify-center text-white hover:bg-[#009070] transition disabled:opacity-50 shadow-lg"
          >
            <i className="fa-solid fa-camera text-sm"></i>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />

        {/* User info */}
        <div className="text-center w-full">
          <p className="text-white font-semibold text-xl truncate px-4">
            {currentUser?.username}
          </p>
          <p className="text-[#8696a0] text-sm mt-1 truncate px-4">
            {currentUser?.email}
          </p>
          {currentUser?.phone && (
            <p className="text-[#8696a0] text-sm mt-0.5">
              <i className="fa-solid fa-phone"></i> : {currentUser?.phone}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[#2a3942]" />

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 py-3 rounded-lg bg-[#00a884] text-white text-sm disabled:opacity-50 hover:bg-[#009070] transition font-medium"
          >
            {uploading ? "Uploading..." : "Change Photo"}
          </button>
          {currentUser?.profilePic && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="flex-1 py-3 rounded-lg bg-[#2a3942] text-white text-sm hover:bg-red-600 disabled:opacity-50 transition"
            >
              {uploading ? "..." : "Remove"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}