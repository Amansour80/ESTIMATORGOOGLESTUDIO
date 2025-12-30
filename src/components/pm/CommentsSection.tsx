import { useState, useEffect } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Comment {
  id: string;
  comment: string;
  created_by: string;
  created_at: string;
  email?: string;
}

interface CommentsSectionProps {
  entityType: 'document' | 'issue' | 'activity';
  entityId: string;
  organizationId: string;
}

export default function CommentsSection({ entityType, entityId, organizationId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [entityId]);

  async function loadComments() {
    try {
      const tableMap = {
        document: { table: 'document_comments', field: 'document_id' },
        issue: { table: 'issue_comments', field: 'issue_id' },
        activity: { table: 'activity_comments', field: 'activity_id' }
      };

      const { table: tableName, field: idField } = tableMap[entityType];

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, entityId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const { data: emails, error: emailsError } = await supabase.rpc('get_organization_members_with_emails', {
          org_id: organizationId
        });

        if (!emailsError && emails) {
          const commentsWithEmails = data.map(comment => ({
            ...comment,
            email: emails.find((e: any) => e.user_id === comment.created_by)?.email || 'Unknown'
          }));
          setComments(commentsWithEmails);
        } else {
          setComments(data);
        }
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tableMap = {
        document: { table: 'document_comments', field: 'document_id' },
        issue: { table: 'issue_comments', field: 'issue_id' },
        activity: { table: 'activity_comments', field: 'activity_id' }
      };

      const { table: tableName, field: idField } = tableMap[entityType];

      const insertData = {
        [idField]: entityId,
        organization_id: organizationId,
        comment: newComment.trim(),
        created_by: user.id
      };

      const { error } = await supabase
        .from(tableName)
        .insert([insertData]);

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const tableMap = {
        document: { table: 'document_comments', field: 'document_id' },
        issue: { table: 'issue_comments', field: 'issue_id' },
        activity: { table: 'activity_comments', field: 'activity_id' }
      };

      const { table: tableName } = tableMap[entityType];

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <MessageSquare className="w-5 h-5" />
        <h3 className="font-medium">Comments ({comments.length})</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900">{comment.email || 'Unknown'}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-gray-400 hover:text-red-600"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-700">{comment.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
