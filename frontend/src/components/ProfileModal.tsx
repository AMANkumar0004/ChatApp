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

    // 5MB limit
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#202c33] rounded-xl p-6 w-80 flex flex-col items-center gap-5">
        <p className="text-white font-semibold text-lg">Profile</p>

        {/* Avatar */}
        <div className="relative">
          {currentUser?.profilePic ? (
            <img
              src={currentUser.profilePic}
              alt="profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-[#00a884]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#00a884] flex items-center justify-center text-white text-3xl font-bold uppercase border-4 border-[#00a884]">
              {currentUser?.username?.[0]}
            </div>
          )}

          {/* Camera icon overlay */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center text-white text-sm hover:bg-[#009070]"
          >
            📷
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
        <div className="text-center">
          <p className="text-white font-medium text-lg">{currentUser?.username}</p>
          <p className="text-[#8696a0] text-sm">{currentUser?.email}</p>
          {currentUser?.phone && (
            <p className="text-[#8696a0] text-sm">{currentUser?.phone}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 py-2 rounded-lg bg-[#00a884] text-white text-sm disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Change Photo"}
          </button>
          {currentUser?.profilePic && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="flex-1 py-2 rounded-lg bg-[#2a3942] text-white text-sm hover:bg-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-[#8696a0] text-sm hover:text-white"
        >
          Close
        </button>
      </div>
    </div>
  );
}