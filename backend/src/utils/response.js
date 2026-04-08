const sendResponse = (res, success, message, data = null, code = null) => {
  res.status(code || (success ? 200 : 400)).json({ success, message, data });
};
module.exports = { sendResponse };
