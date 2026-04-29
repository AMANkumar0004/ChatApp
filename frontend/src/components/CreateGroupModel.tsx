import { useState } from "react";
import { toast } from "react-toastify";

export default function CreateGroupModal({
  contacts,
  onClose,
  onCreateGroup,
}: {
  contacts: any[];
  onClose: () => void;
  onCreateGroup: (name: string, members: any[]) => void;
}) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Only show contacts when searching
  const filteredContacts = searchQuery.trim()
    ? contacts
        .filter((c) => !c.isGroup)
        .filter((c) =>
          c.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    : [];

  const toggleMember = (user: any) => {
    const isSelected = selectedMembers.find((m) => m._id === user._id);
    if (isSelected) {
      setSelectedMembers((prev) => prev.filter((m) => m._id !== user._id));
    } else {
      setSelectedMembers((prev) => [...prev, user]);
    }
  };

  const isSelected = (userId: string) =>
    !!selectedMembers.find((m) => m._id === userId);

  const handleSubmit = () => {
    if (!groupName.trim() || selectedMembers.length === 0) {
      toast.info("Group name and at least one member are required");
      return;
    }
    onCreateGroup(groupName, selectedMembers);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4">
      <div className="bg-[#202c33] rounded-t-2xl sm:rounded-xl p-5 sm:p-6 w-full sm:w-96 sm:max-w-sm flex flex-col gap-4 max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <p className="font-semibold text-lg text-white">Create Group</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2a3942] text-[#8696a0] hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Group Name */}
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name..."
          className="px-4 py-3 rounded-lg bg-[#2a3942] text-white text-sm outline-none placeholder-[#8696a0] flex-shrink-0"
        />

        {/* Search contacts */}
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your contacts..."
          className="px-4 py-3 rounded-lg bg-[#2a3942] text-white text-sm outline-none placeholder-[#8696a0] flex-shrink-0"
        />

        {/* Selected member chips */}
        {selectedMembers.length > 0 && (
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {selectedMembers.map((m) => (
              <span
                key={m._id}
                onClick={() => toggleMember(m)}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#00a884] text-white text-xs cursor-pointer hover:bg-[#009070] transition"
              >
                {m.username} ✕
              </span>
            ))}
          </div>
        )}

        {/* Selected count */}
        <p className="text-xs text-[#8696a0] flex-shrink-0">
          {selectedMembers.length} member(s) selected
        </p>

        {/* Contacts list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">

          {/* No search yet — show hint */}
          {!searchQuery.trim() && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              
              <p className="text-[#8696a0] text-xs text-center">
                Search your contacts above to add members
              </p>
            </div>
          )}

          {/* Searched but no match */}
          {searchQuery.trim() && filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <p className="text-[#8696a0] text-xs text-center">
                No contacts match "{searchQuery}"
              </p>
            </div>
          )}

          {/* Results */}
          {filteredContacts.map((contact) => (
            <div
              key={contact.conversationId}
              onClick={() => toggleMember(contact.user)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                isSelected(contact.user._id)
                  ? "bg-[#00a884]"
                  : "bg-[#2a3942] hover:bg-[#3a4952]"
              }`}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-[#111b21] flex items-center justify-center font-bold uppercase text-sm text-white flex-shrink-0 overflow-hidden">
                {contact.user?.profilePic ? (
                  <img
                    src={contact.user.profilePic}
                    className="w-full h-full object-cover"
                    alt={contact.user.username}
                  />
                ) : (
                  contact.user?.username?.[0]
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{contact.user?.username}</p>
                <p className="text-xs text-[#8696a0] truncate">{contact.user?.email}</p>
              </div>

              {isSelected(contact.user._id) && (
                <span className="text-white text-sm flex-shrink-0">✓</span>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-shrink-0 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-[#2a3942] text-sm text-white hover:bg-[#3a4952] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-lg bg-[#00a884] text-sm text-white hover:bg-[#009070] transition font-medium"
          >
            Create
          </button>
        </div>

      </div>
    </div>
  );
}