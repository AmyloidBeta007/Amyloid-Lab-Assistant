export interface ExportDocPayload {
  title: string;
  markdownContent: string;
  modelPersona: string;
  mode: string;
  researcherName?: string;
}

export interface GoogleDocExportResult {
  documentId: string;
  title: string;
  url: string;
  createdAt: string;
}

/**
 * Creates a new Google Doc via Google Docs REST API and populates it with the
 * AI brainstormed synthesis, research hypotheses, or protocol drafts.
 */
export async function exportToGoogleDoc(
  payload: ExportDocPayload,
  accessToken: string
): Promise<GoogleDocExportResult> {
  if (!accessToken) {
    throw new Error('No active Google access token. Please connect with Google first.');
  }

  const docTitle = payload.title.trim() || `BioSynth LabOS Research - ${new Date().toISOString().split('T')[0]}`;

  // 1. Create a blank Google Document
  const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!createResponse.ok) {
    const errorBody = await createResponse.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Google Docs API error (${createResponse.status})`;
    if (createResponse.status === 401) {
      throw new Error('Google authorization expired. Please sign in with Google again.');
    }
    throw new Error(message);
  }

  const createdDoc = await createResponse.json();
  const documentId = createdDoc.documentId;

  // 2. Prepare structured text for insertion
  const dateStr = new Date().toLocaleString();
  const headerText = [
    `========================================================================`,
    `BIOSYNTH LABOS - AI RESEARCH SYNTHESIS & BRAINSTORM`,
    `========================================================================`,
    `Title: ${docTitle}`,
    `Generated: ${dateStr}`,
    `Model Persona: ${payload.modelPersona.toUpperCase()}`,
    `Writing Mode: ${payload.mode.toUpperCase()}`,
    `Exported from: BioSynth LabOS Research Cockpit`,
    `========================================================================\n\n`,
    payload.markdownContent,
    `\n\n------------------------------------------------------------------------`,
    `Document generated automatically via BioSynth LabOS Google Docs Integration.`,
    `------------------------------------------------------------------------\n`
  ].join('\n');

  // 3. BatchUpdate to insert text into the new document at index 1
  const updateResponse = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: {
                index: 1,
              },
              text: headerText,
            },
          },
        ],
      }),
    }
  );

  if (!updateResponse.ok) {
    console.warn('Document was created, but inserting text returned an error:', await updateResponse.text());
  }

  return {
    documentId,
    title: docTitle,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    createdAt: new Date().toISOString(),
  };
}
