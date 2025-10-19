import {
  MessageCircle,
  Send,
  Reply,
  ThumbsUp,
  Trash2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { baseUrl as BASE_URL } from "@/config";

export default function YouTubeComments({ videoId }) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [newComment, setNewComment] = useState("");
  // comments state
  const [comments, setComments] = useState([]);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);

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
    setIsAddingComment(true);
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
        setNewComment("");
        toast.success("Your comment has been posted successfully.");
      } else {
        throw new Error("Failed to post comment");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to post comment. Please try again.");
    } finally {
      setIsAddingComment(false);
    }
  };

  // 🔹 Reply to a comment
  const handleReply = async (parentCommentId) => {
    if (!replyText.trim()) return;
    setReplyingToId(parentCommentId);
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
        setReplyingTo(null);
        toast.success("Your reply has been posted successfully.");
      } else {
        throw new Error("Failed to post reply");
      }
    } catch (err) {
      console.error("Error replying to comment:", err);
      toast.error("Failed to post reply. Please try again.");
    } finally {
      setReplyingToId(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      toast.info("Deleting Comment.");
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
      console.error(error);
      toast.error(`Failed to delete comment.` + error.message);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Comments
        </CardTitle>
        <CardDescription>
          Join the conversation with {comments.length}{" "}
          {comments.length === 1 ? "comment" : "comments"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Add comment input */}
        <div className="flex gap-2 mb-6">
          <Input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && newComment.trim() && !isAddingComment) {
                handleAddComment();
              }
            }}
            disabled={isAddingComment}
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isAddingComment}
            className="bg-green-600 hover:bg-green-700">
            {isAddingComment ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </div>

        {/* Comment threads */}
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            ) : (
              comments.map((item) => {
                const commentData = getCommentData(item);

                if (!commentData) {
                  return (
                    <p
                      key={item.id}
                      className="text-muted-foreground text-sm italic">
                      Unable to display comment
                    </p>
                  );
                }

                const { id, snippet, replies } = commentData;

                return (
                  <Card key={id} className="border">
                    <CardContent className="pt-4">
                      {/* Author info */}
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={snippet.authorProfileImageUrl}
                            alt={snippet.authorDisplayName}
                          />
                          <AvatarFallback>
                            {snippet.authorDisplayName?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <a
                            href={snippet.authorChannelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold hover:underline">
                            {snippet.authorDisplayName}
                          </a>
                          <p className="text-xs text-muted-foreground">
                            {new Date(snippet.publishedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Comment text */}
                      <p
                        className="text-sm mb-3 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: snippet.textDisplay,
                        }}
                      />

                      {/* Actions */}
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setReplyingTo(replyingTo === id ? null : id)
                          }
                          className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Reply className="w-4 h-4 mr-1" />
                          Reply
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 hover:bg-gray-50">
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {snippet.likeCount || 0}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(id)}
                          className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>

                      {/* Reply box */}
                      {replyingTo === id && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Write a reply..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyPress={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  replyText.trim() &&
                                  replyingToId !== id
                                ) {
                                  handleReply(id);
                                }
                              }}
                              disabled={replyingToId === id}
                            />
                            <Button
                              onClick={() => handleReply(id)}
                              disabled={
                                !replyText.trim() || replyingToId === id
                              }
                              size="sm">
                              {replyingToId === id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                "Send"
                              )}
                            </Button>
                          </div>
                        </>
                      )}

                      {/* Replies */}
                      {replies?.comments?.length > 0 && (
                        <>
                          <Separator className="my-4" />
                          <div className="ml-6 space-y-3">
                            {replies.comments.map((reply) => {
                              const rs = reply.snippet;
                              return (
                                <div
                                  key={reply.id}
                                  className="flex items-start gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage
                                      src={rs.authorProfileImageUrl}
                                      alt={rs.authorDisplayName}
                                    />
                                    <AvatarFallback>
                                      {rs.authorDisplayName
                                        ?.charAt(0)
                                        .toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">
                                      {rs.authorDisplayName}
                                    </p>
                                    <p
                                      className="text-sm text-muted-foreground"
                                      dangerouslySetInnerHTML={{
                                        __html: rs.textDisplay,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
