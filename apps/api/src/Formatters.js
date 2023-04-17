const staticSelectFormatter = (item) => {
  return {
    "text": {
      "type": "plain_text",
      "text": `Frontend Engineering ${item}`,
    },
    "value": "item"
  }
}
module.exports = { staticSelectFormatter };