import type { NormalizedIntakePayload } from "./normalize";

export interface TwentySyncResult {
  contactId: string | null;
  opportunityId: string | null;
  synced: boolean;
  error: string | null;
}

export async function syncToTwenty(
  _normalized: NormalizedIntakePayload,
  _submissionId: number
): Promise<TwentySyncResult> {
  // TODO: Implement Twenty CRM sync
  // Twenty CRM uses a GraphQL API. You'll need:
  //   TWENTY_API_KEY in your environment
  //   TWENTY_API_URL (e.g. https://api.twenty.com or your self-hosted URL)
  //
  // Suggested flow:
  // 1. Upsert contact by email: createPerson / updatePerson mutation
  // 2. Create opportunity/deal with the estimate range and service details
  // 3. Add a note with the full submission summary
  //
  // Example:
  // const headers = { Authorization: `Bearer ${process.env.TWENTY_API_KEY}`, "Content-Type": "application/json" };
  // const res = await fetch(`${process.env.TWENTY_API_URL}/graphql`, { method: "POST", headers, body: JSON.stringify({ query, variables }) });

  return {
    contactId: null,
    opportunityId: null,
    synced: false,
    error: "Twenty sync not yet implemented",
  };
}
