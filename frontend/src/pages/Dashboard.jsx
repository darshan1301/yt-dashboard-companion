import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, ExternalLink } from "lucide-react";
import { baseUrl as BASE_URL } from "../config";

export default function Dashboard() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/vid`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      } else {
        console.error("Failed to fetch videos");
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-700 text-lg">Loading videos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Video className="w-6 h-6 text-red-600" />
            My Uploaded Videos
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {videos.length === 0 ? (
          <p className="text-gray-600">No videos found on your channel.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {videos.map((v) => (
              <div
                key={v.id}
                className="bg-white shadow rounded-lg overflow-hidden flex flex-col">
                <img
                  src={v.thumbnails?.medium?.url || v.thumbnails?.default?.url}
                  alt={v.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold mb-2">{v.title}</h3>
                  <p className="text-sm text-gray-600 flex-grow line-clamp-2">
                    {v.description}
                  </p>
                  <button
                    onClick={() => navigate(`/video/${v.id}`)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
