const Metadata = ({ client }) => {
  const _get =  async () => {
    const MetadataQuery = `
      query Metadata {
        metadata {
          metadata
        }
      }
    `;
    const response = await client.query(MetadataQuery);
    return response?.data?.metadata?.metadata;
  }
  const get = async () => await _get();
  return { get }
}

export { Metadata }