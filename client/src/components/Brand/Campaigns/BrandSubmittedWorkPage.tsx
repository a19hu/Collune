import {
  ExternalLink,
  Loader2,
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Flag,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getBrandCampaignWorkSubmissions,
  getBrandWorkSubmissions,
  reviewBrandCampaignWorkSubmission,
} from '../../../lib/authApi';
import type { CampaignWorkSubmissionApi } from '../../../types';
import { showProjectToast } from '../../../HtmlComponents/HtmlRoster';

const label = (status: string) =>
  status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const statusClass = (status: string) =>
  status === 'APPROVED' || status === 'COMPLETED'
    ? 'bg-[#e8f8ef] text-[#15965a]'
    : status === 'REVISION_REQUESTED' || status === 'REJECTED'
      ? 'bg-[#ffe9e9] text-[#c23535]'
      : 'bg-[#fff4d6] text-[#9a6400]';

export function BrandSubmittedWorkPage() {
  const { campaignId = '' } = useParams();
  const [items, setItems] = useState<CampaignWorkSubmissionApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentFor, setCommentFor] = useState<{
    id: string;
    action: 'REQUEST_REVISION' | 'ADD_COMMENT';
  } | null>(null);
  const [comment, setComment] = useState('');
  const [workingId, setWorkingId] = useState('');

  const load = () =>
    (campaignId
      ? getBrandCampaignWorkSubmissions(campaignId)
      : getBrandWorkSubmissions()
    )
      .then(setItems)
      .catch((error) =>
        showProjectToast(
          'error',
          'Could not load submitted work',
          error instanceof Error ? error.message : 'Please try again.'
        )
      )
      .finally(() => setIsLoading(false));
  useEffect(() => {
    void load();
  }, [campaignId]);

  const review = async (
    id: string,
    action:
      | 'APPROVE'
      | 'REQUEST_REVISION'
      | 'REJECT'
      | 'ADD_COMMENT'
      | 'MARK_COMPLETED',
    text = ''
  ) => {
    setWorkingId(id);
    try {
      const updated = await reviewBrandCampaignWorkSubmission(
        campaignId,
        id,
        action,
        text
      );
      setItems((current) =>
        current.map((item) => (item.id === id ? updated : item))
      );
      setCommentFor(null);
      setComment('');
      showProjectToast(
        'success',
        action === 'REQUEST_REVISION'
          ? 'Revision requested'
          : 'Submission updated',
        'The creator has been notified.'
      );
    } catch (error) {
      showProjectToast(
        'error',
        'Could not update submission',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setWorkingId('');
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-[#dfe6f0] bg-white p-5 shadow-sm sm:p-6">
        <div>
          <h1 className="text-xl font-black text-[#1d2430]">Submitted Work</h1>
          <p className="mt-1 text-sm font-medium text-[#65758f]">
            Review creator content submitted for this campaign.
          </p>
        </div>
        <div className="mt-6 overflow-x-auto rounded-lg border border-[#dbe3ee]">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-[#f8faff] text-xs font-black uppercase text-[#63708a]">
              <tr>
                <th className="px-4 py-3">Creator</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Content Type</th>
                <th className="px-4 py-3">Submitted Link</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eaf2]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#4b22ff]" />
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="text-[#25304a]">
                    <td className="px-4 py-4 font-bold">
                      {item.creator_name || 'Creator'}
                    </td>
                    <td className="px-4 py-4">{item.platform}</td>
                    <td className="px-4 py-4">{item.content_type}</td>
                    <td className="px-4 py-4">
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#3048ff] hover:underline"
                      >
                        View <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      {new Intl.DateTimeFormat('en', {
                        day: 'numeric',
                        month: 'short',
                      }).format(new Date(item.submitted_at || item.created_at))}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-md px-2.5 py-1 text-xs font-black ${statusClass(item.status)}`}
                      >
                        {label(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        <a
                          href={item.content_url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="View submission"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#c9d7ff] text-[#173ca8]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void review(item.id, 'APPROVE')}
                          disabled={!!workingId}
                          title="Approve"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#bce9cf] text-[#15965a]"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCommentFor({
                              id: item.id,
                              action: 'REQUEST_REVISION',
                            });
                            setComment(item.brand_comment || '');
                          }}
                          disabled={!!workingId}
                          title="Request revision"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#f4d28d] text-[#9a6400]"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCommentFor({
                              id: item.id,
                              action: 'ADD_COMMENT',
                            });
                            setComment(item.brand_comment || '');
                          }}
                          disabled={!!workingId}
                          title="Add comment"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#c9d7ff] text-[#173ca8]"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void review(item.id, 'REJECT')}
                          disabled={!!workingId}
                          title="Reject"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#f3b7b7] text-[#c23535]"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void review(item.id, 'MARK_COMPLETED')}
                          disabled={!!workingId}
                          title="Mark work completed"
                          className="grid h-8 w-8 place-items-center rounded-md border border-[#bce9cf] text-[#15965a]"
                        >
                          <Flag className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && !items.length ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center font-semibold text-[#65758f]"
                  >
                    No creator submissions yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {commentFor ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void review(commentFor.id, commentFor.action, comment);
            }}
            className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-black text-[#1d2430]">
              {commentFor.action === 'REQUEST_REVISION'
                ? 'Request revision'
                : 'Add comment'}
            </h2>
            <p className="mt-1 text-sm text-[#65758f]">
              {commentFor.action === 'REQUEST_REVISION'
                ? 'Explain what the creator should update. This comment is required.'
                : 'The creator will receive your comment.'}
            </p>
            <textarea
              required
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              placeholder="Please add the campaign hashtag and update the CTA."
              className="mt-4 w-full rounded-md border border-[#d7deea] p-3 text-sm"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCommentFor(null)}
                className="h-10 rounded-md border border-[#d7deea] px-4 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                disabled={!!workingId}
                className="h-10 rounded-md bg-[#4b22ff] px-4 text-sm font-black text-white"
              >
                {workingId ? 'Saving...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
