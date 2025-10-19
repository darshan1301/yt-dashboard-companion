import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { baseUrl as BASE_URL } from "../config";
import Notes from "../component/Notes";
import YouTubeComments from "../component/YoutubeComments";
import { toast } from "sonner";

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
        toast.success("Saved successfully.");
      }
    } catch (err) {
      console.error("Error updating video:", err);
      toast.error("Error saving...");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-6 py-4">
          <Skeleton className="h-8 w-48" />
        </header>
        <main className="max-w-4xl mx-auto p-6 space-y-6">
          <Card>
            <Skeleton className="w-full h-64" />
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </main>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Video Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Edit and manage your video
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Video info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Thumbnail */}
              <div className="relative">
                <img
                  src={
                    video.thumbnails?.high?.url ||
                    video.thumbnails?.default?.url
                  }
                  alt={video.title}
                  className="w-full h-full min-h-[300px] object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg" />
              </div>

              {/* Right Column - Title & Description */}
              <div className="flex flex-col space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Video Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title..."
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter video description..."
                    className="resize-none h-full min-h-[200px]"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={saving || (!title && !description)}
                    size="lg">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Notes videoId={id} />

        {/* Comments */}
        <YouTubeComments videoId={id} />
      </main>
    </div>
  );
}
