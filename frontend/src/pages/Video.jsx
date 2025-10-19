import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { baseUrl as BASE_URL } from "../config";
import Notes from "../component/Notes";
import YouTubeComments from "../component/YoutubeComments";

export default function VideoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchVideo();
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

        <Notes videoId={id} />

        {/* Comments */}
        <YouTubeComments videoId={id} />
      </main>
    </div>
  );
}
