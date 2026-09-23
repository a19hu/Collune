import { ExternalLink, Eye, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCreatorWorkSubmissions } from '../../../lib/authApi';

type SubmittedWorkItem = {
  id: string;
  campaignId: string;
  brandId: string;
  campaignName: string;
  brandName: string;
  platform: string;
  contentType: string;
  submittedLink: string;
  submissionDate: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Revision Requested';
  description: string;
  creatorRemarks: string;
  brandComment: string;
  screenshotUrl: string | null;
  attachmentUrl: string | null;
};

const statusClasses: Record<SubmittedWorkItem['status'], string> = {
  Submitted: 'bg-[#eaf0ff] text-[#3048ff]',
  'Under Review': 'bg-[#fff4d6] text-[#a46500]',
  Approved: 'bg-[#cbf8df] text-[#00a875]',
  'Revision Requested': 'bg-[#ffe6e9] text-[#c0354b]',
};

export function SubmittedWork() {
  const navigate = useNavigate();
  const [submittedWork, setSubmittedWork] = useState<SubmittedWorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState<SubmittedWorkItem | null>(
    null
  );

  useEffect(() => {
    getCreatorWorkSubmissions()
      .then((items) =>
        setSubmittedWork(
          items.map((item) => ({
            id: item.id,
            campaignId: item.campaign_id,
            brandId: item.brand_id,
            campaignName: item.campaign_name || 'Campaign',
            brandName: item.brand_name || 'Brand',
            platform: item.platform,
            contentType: item.content_type,
            submittedLink: item.content_url,
            submissionDate: new Intl.DateTimeFormat('en', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(item.submitted_at || item.created_at)),
            status:
              item.status === 'APPROVED'
                ? 'Approved'
                : item.status === 'REVISION_REQUESTED'
                  ? 'Revision Requested'
                  : item.status === 'SUBMITTED'
                    ? 'Submitted'
                    : 'Under Review',
            description: item.description,
            creatorRemarks: item.creator_remarks,
            brandComment: item.brand_comment,
            screenshotUrl: item.screenshot_url,
            attachmentUrl: item.attachment_url,
          }))
        )
      )
      .catch(() => setSubmittedWork([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-[#dfe6f0] bg-white p-5 shadow-[0_2px_4px_rgba(20,30,60,0.02)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-[#1d2430]">
              Submitted Work
            </h1>
            <p className="mt-1 text-sm font-medium text-[#65758f]">
              Track the content you have submitted for your campaigns.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#eaf0ff] px-3 py-1 text-xs font-black text-[#3048ff]">
              {submittedWork.length} submissions
            </span>
            <button
              type="button"
              onClick={() => navigate('/creator/submitted-work/add')}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#5168ff] px-3 text-xs font-black text-white hover:bg-[#4056e5]"
            >
              <Plus className="h-4 w-4" /> Add submitted work
            </button>
          </div>
        </div>

        <div
          role="region"
          aria-label="Submitted work table"
          tabIndex={0}
          className="mt-6 max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-[#dbe3ee]"
        >
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-[#f8faff] text-xs font-black uppercase tracking-wide text-[#63708a]">
              <tr>
                <th className="px-4 py-3">Campaign Name</th>
                <th className="px-4 py-3">Brand Name</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Content Type</th>
                <th className="px-4 py-3">Submitted Link</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5eaf2]">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#5168ff]" />
                  </td>
                </tr>
              ) : (
                submittedWork.map((item) => (
                  <tr
                    key={item.id}
                    className="text-[#25304a] hover:bg-[#fbfcff]"
                  >
                    <td className="px-4 py-4 font-bold">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/creator/marketplace/${item.campaignId}`)
                        }
                        className="hover:text-[#3048ff] hover:underline"
                      >
                        {item.campaignName}
                      </button>
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      <button
                        type="button"
                        onClick={() => navigate(`/brands/${item.brandId}`)}
                        className="hover:text-[#3048ff] hover:underline"
                      >
                        {item.brandName}
                      </button>
                    </td>
                    <td className="px-4 py-4">{item.platform}</td>
                    <td className="px-4 py-4">{item.contentType}</td>
                    <td className="max-w-[220px] px-4 py-4">
                      <a
                        href={item.submittedLink}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View submitted work for ${item.campaignName}`}
                        className="inline-flex h-8 items-center  font-black text-[#173ca8] "
                      >{item.submittedLink}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      {item.submissionDate}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-black ${statusClasses[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedWork(item)}
                        className="inline-flex max-w-full items-center gap-1 truncate font-semibold text-[#3048ff] hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && !submittedWork.length ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center font-semibold text-[#65758f]"
                  >
                    No submitted work yet. Add work for an accepted campaign to
                    get started.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
      {selectedWork ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <section
            role="dialog"
            aria-modal="true"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#1d2430]">
                  Submission details
                </h2>
                <p className="mt-1 text-sm text-[#65758f]">
                  {selectedWork.campaignName} · {selectedWork.brandName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWork(null)}
                aria-label="Close"
                className="text-[#65758f]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 grid gap-4 text-sm">
              <p>
                <strong>Platform:</strong> {selectedWork.platform} ·{' '}
                {selectedWork.contentType}
              </p>
              <p>
                <strong>Status:</strong> {selectedWork.status}
              </p>
              <p>
                <strong>Work details:</strong>
                <br />
                {selectedWork.description || 'No details added.'}
              </p>
              {selectedWork.creatorRemarks ? (
                <p>
                  <strong>Your remarks:</strong>
                  <br />
                  {selectedWork.creatorRemarks}
                </p>
              ) : null}
              <div className="rounded-lg bg-[#f8faff] p-4">
                <strong>Brand comment</strong>
                <p className="mt-1">
                  {selectedWork.brandComment ||
                    'No comment from the brand yet.'}
                </p>
              </div>
              <a
                href={selectedWork.submittedLink}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-[#3048ff] hover:underline"
              >
                Open published content
              </a>
              {selectedWork.screenshotUrl ? (
                <a
                  href={selectedWork.screenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#3048ff] hover:underline"
                >
                  View screenshot / proof
                </a>
              ) : null}
              {selectedWork.attachmentUrl ? (
                <a
                  href={selectedWork.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-[#3048ff] hover:underline"
                >
                  Download attachment
                </a>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
