function myFunction(e) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  Logger.log(JSON.stringify({ email: e.values[1], code: code }));
  createAccount({ email: e.values[1], code: code });
}

function createAccount(data) {
  MailApp.sendEmail(
    data.email,
    'VLC CANVAS DAY -- LOGIN CODE',
    `This is your login code: 
    
    ${data.code}
    
    Now go to https://vlcboard.replit.app/
    
    Do not delete this email until Canvas Day is over.`,
  );
  
  const url = "https://vlcboard.replit.app/createaccount";
  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "THIS_IS_VERY_SECRET",
    },
    payload: JSON.stringify(data),
  };
  UrlFetchApp.fetch(url, options);
}
