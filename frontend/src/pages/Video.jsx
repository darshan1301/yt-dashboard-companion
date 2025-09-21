import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Save,
  Send,
  Reply,
} from "lucide-react";
import { baseUrl as BASE_URL } from "../config";

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  // comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  const fetchVideo = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/vid/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setVideo(data.video);
        setTitle(data.video.title || "");
        setDescription(data.video.description || "");
      }
    } catch (err) {
      console.error("Error fetching video:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Save title/description
  const handleSave = async () => {
    if (!title && !description) return;
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/api/vid/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        const data = await res.json();
        setVideo((prev) => ({ ...prev, ...data.video }));
      }
    } catch (err) {
      console.error("Error updating video:", err);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Add top-level comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoId: id, text: newComment }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [...prev, created]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  // 🔹 Reply to a comment
  const handleReply = async (parentCommentId) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/comments/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ parentCommentId, text: replyText }),
      });
      if (res.ok) {
        const reply = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentCommentId
              ? { ...c, replies: [...(c.replies || []), reply] }
              : c
          )
        );
        setReplyText("");
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("Error replying to comment:", err);
    }
  };

  useEffect(() => {
    fetchVideo();
    // optionally: fetch existing comments if you expose them in your backend
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-700 text-lg">Loading video...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Video not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded hover:bg-gray-200">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800">Video Details</h1>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Video info */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <img
            src={video.thumbnails?.high?.url || video.thumbnails?.default?.url}
            alt={video.title}
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-bold mb-2 border rounded px-3 py-2"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full border rounded px-3 py-2 text-gray-700 mb-4"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Comments
          </h2>

          {/* Add comment box */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-grow border rounded px-3 py-2"
            />
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700">
              <Send className="w-4 h-4" />
              Post
            </button>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="border rounded p-3">
                <p className="text-gray-800">{c.text}</p>
                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === c.id ? null : c.id)
                  }
                  className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:underline">
                  <Reply className="w-4 h-4" />
                  Reply
                </button>

                {/* Reply box */}
                {replyingTo === c.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="flex-grow border rounded px-3 py-2"
                    />
                    <button
                      onClick={() => handleReply(c.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                      Send
                    </button>
                  </div>
                )}

                {/* Show replies */}
                {c.replies?.length > 0 && (
                  <div className="mt-3 ml-6 space-y-2">
                    {c.replies.map((r) => (
                      <p key={r.id} className="text-sm text-gray-600">
                        ↳ {r.text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
