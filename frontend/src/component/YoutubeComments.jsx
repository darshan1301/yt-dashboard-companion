import { MessageCircle, Send, Reply, ThumbsUp, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { baseUrl as BASE_URL } from "../config";

export default function YouTubeComments({ videoId }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [newComment, setNewComment] = useState("");
  // comments state
  const [comments, setComments] = useState([]);

  const fetchComments = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.items);
      }
    } catch (err) {
      console.error("Error fetching video:", err);
    }
  };

  useEffect(() => {
    fetchComments(videoId);
  }, [videoId]);

  // 🔹 Add top-level comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videoId, text: newComment }),
      });
      if (res.ok) {
        const created = await res.json();
        setComments((prev) => [created.comment, ...prev]);
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
        const { reply } = await res.json();
        setComments((prev) =>
          prev.map((c) => {
            // Match by direct id or by topLevelComment id (for commentThreads)
            const matchesId =
              c.id === parentCommentId ||
              c.snippet?.topLevelComment?.id === parentCommentId;

            if (matchesId) {
              return {
                ...c,
                replies: {
                  comments: [...(c.replies?.comments || []), reply],
                },
              };
            }
            return c;
          })
        );
        setReplyText("");
      }
    } catch (err) {
      console.error("Error replying to comment:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setComments((prev) => {
          return prev.filter((item) => item.id !== commentId);
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getCommentData = (item) => {
    // If it's a commentThread, extract the topLevelComment
    if (
      item.kind === "youtube#commentThread" &&
      item.snippet?.topLevelComment
    ) {
      return {
        id: item.id,
        snippet: item.snippet.topLevelComment.snippet,
        replies: item.replies,
        isThread: true,
      };
    }

    // If it's a direct comment object
    if (item.kind === "youtube#comment" && item.snippet) {
      return {
        id: item.id,
        snippet: item.snippet,
        replies: null,
        isThread: false,
      };
    }

    // Fallback for unexpected structures
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        Comments
      </h2>

      {/* Add comment input */}
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

      {/* Comment threads */}
      <div className="space-y-4">
        {comments.map((item) => {
          const commentData = getCommentData(item);

          if (!commentData) {
            return (
              <p key={item.id} className="text-gray-500 text-sm italic">
                Unable to display comment
              </p>
            );
          }

          const { id, snippet, replies } = commentData;

          return (
            <div key={id} className="border rounded p-3">
              {/* Author info */}
              <div className="flex items-center gap-3 mb-2">
                <img
                  src={snippet.authorProfileImageUrl}
                  alt={snippet.authorDisplayName}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <a
                    href={snippet.authorChannelUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gray-800 hover:underline">
                    {snippet.authorDisplayName}
                  </a>
                  <p className="text-xs text-gray-500">
                    {new Date(snippet.publishedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Comment text */}
              <p
                className="text-gray-800 text-sm"
                dangerouslySetInnerHTML={{ __html: snippet.textDisplay }}
              />

              {/* Actions */}
              <div className="mt-2 flex gap-4">
                <button
                  onClick={() => setReplyingTo(replyingTo === id ? null : id)}
                  className="text-sm text-blue-600 flex items-center gap-1 hover:underline">
                  <Reply className="w-4 h-4" />
                  Reply
                </button>

                <button className="text-sm text-gray-600 flex items-center gap-1 hover:underline">
                  <ThumbsUp className="w-4 h-4" />
                  {snippet.likeCount || 0}
                </button>

                <button
                  onClick={() => handleDeleteComment(id)}
                  className="text-sm text-red-600 flex items-center gap-1 hover:underline">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>

              {/* Reply box */}
              {replyingTo === id && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-grow border rounded px-3 py-2"
                  />
                  <button
                    onClick={() => handleReply(id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Send
                  </button>
                </div>
              )}

              {/* Replies */}
              {replies?.comments?.length > 0 && (
                <div className="mt-3 ml-6 space-y-2">
                  {replies.comments.map((reply) => {
                    const rs = reply.snippet;
                    return (
                      <div key={reply.id} className="flex items-start gap-2">
                        <img
                          src={rs.authorProfileImageUrl}
                          alt={rs.authorDisplayName}
                          className="w-6 h-6 rounded-full mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {rs.authorDisplayName}
                          </p>
                          <p
                            className="text-sm text-gray-600"
                            dangerouslySetInnerHTML={{
                              __html: rs.textDisplay,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
