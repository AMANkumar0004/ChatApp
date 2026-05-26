import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Messages.js";
import redis from "../config/redis.js";
// GET /api/conversations/contacts
export const getContacts = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username email profilePic")
      .populate("lastMessage", "text fileType createdAt");

    const contacts = conversations.map((conv) => {
      if (conv.type === "group") {
        return {
          conversationId: conv._id,
          isGroup: true,
          groupName: conv.groupInfo.name,
          groupAdmin: conv.groupInfo.admin,
          participants: conv.participants,
          lastMessage: conv.lastMessage || null,
        };
      }

      const other = conv.participants.find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      return {
        conversationId: conv._id,
        isGroup: false,
        user: other,
        lastMessage: conv.lastMessage || null,
      };
    });

    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations
export const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      type: "private",
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [senderId, receiverId],
      });
    }

    res.json({ conversation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/conversations/:conversationId/messages
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const cacheKey = `messages:${conversationId}`;

    const cached = await redis.get(cacheKey);
    console.log("Cache hit?", !!cached); // ✅ add this

    if (cached) {
      return res.json({ messages: JSON.parse(cached) });
    }

    const messages = await Message.find({ conversationId })
      .populate("sender", "username profilePic")
      .sort({ createdAt: 1 });

    try {
      await redis.setex(cacheKey, 120, JSON.stringify(messages));
      console.log("✅ Messages cached:", messages.length); // ✅ add this
    } catch (redisErr) {
      console.error("❌ Cache failed:", redisErr.message); // ✅ add this
    }

    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/conversations/group
export const createGroup = async (req, res) => {
  try {
    const { name, memberIds } = req.body;
    const adminId = req.user._id;

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ message: "Group name and members are required" });
    }

    const participants = [adminId, ...memberIds];

    const conversation = await Conversation.create({
      type: "group",
      participants,
      groupInfo: {
        name,
        admin: adminId,
      },
    });

    const populated = await conversation.populate("participants", "username email");

    res.json({ conversation: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};