export const adapter = ({ baseUrl, apiKey }) => {
  const vendor = "Plane";
  const matchers = [/plane\.brewww\.net/];
  const extract = (url) => {
    const regex =
      // eslint-disable-next-line no-useless-escape
      /https:\/\/plane\.brewww\.net\/([^\/]+)\/projects\/([^\/]+)\/issues\/([^\/]+)/;
    const match = url.match(regex);
    return match
      ? { workspace: match[1], projectId: match[2], issueId: match[3] }
      : null;
  };
  const get = async ({ url }) => {
    if (!baseUrl || !apiKey) throw new Error("Required parameters missing.");
    const { workspace, projectId, issueId } = extract(url);
    if (!workspace || !projectId || !issueId)
      throw new Error("Cannot parse source URL for parameters.");
    const options = { method: "GET", headers: { "x-api-key": `${apiKey}` } };
    const result = await fetch(
      `${baseUrl}/workspaces/${workspace}/projects/${projectId}/issues/${issueId}`,
      options,
    );
    if (!result.ok) throw new Error("Request to API failed.");
    const { name } = await result.json();
    return {
      title: name || null,
    };
  };
  return {
    vendor,
    matchers,
    get,
  };
};
