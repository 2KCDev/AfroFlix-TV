import React, { useEffect, useState } from 'react';
import { FiCheck, FiRefreshCw, FiX } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import { api } from '../../services/api';
import { formatDate } from '../../utils/content';

const AdminModerationQueue = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getModerationQueue({ limit: 50 });
      setComments(data.comments || []);
      setMessage('');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (commentId, action) => {
    try {
      if (action === 'approve') await api.approveComment(commentId);
      if (action === 'reject') await api.rejectComment(commentId);
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">File de modération</h2>
          <p className="text-gray-600">Validation manuelle des commentaires suspects, signalés ou en attente.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
          <FiRefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {message && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{message}</div>}

      {loading ? (
        <LoadingSpinner />
      ) : comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-5">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-900">{comment.author_name || comment.username || 'Auteur'}</span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">{comment.status}</span>
                    <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-500">{comment.author_email || comment.email}</p>
                  <p className="text-gray-700">{comment.content || comment.text}</p>
                  {comment.film_title && <p className="text-sm text-gray-500">Film: {comment.film_title}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(comment.id, 'approve')}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    <FiCheck size={16} />
                    Approuver
                  </button>
                  <button
                    onClick={() => act(comment.id, 'reject')}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                  >
                    <FiX size={16} />
                    Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-600">
          Aucun commentaire en attente de modération.
        </div>
      )}
    </section>
  );
};

export default AdminModerationQueue;

