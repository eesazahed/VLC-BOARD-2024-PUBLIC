const authToken = document.cookie.includes("token=")
  ? document.cookie.split("token=").pop().split(";")[0]
  : null;

const login = async () => {
  const username = document.getElementById("username").value;
  const logincode = document.getElementById("logincode").value;

  const request = await fetch("/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, logincode }),
  });

  if (request.status === 200) {
    const data = await request.json();

    document.cookie = `token=${data.token};max-age=31536000`;

    generateCountdown(placeButton, data.cooldown);

    window.location.reload();
    return false;
  } else {
    request.text().then((text) => displayErrorMessage(text));
  }
};

// let url = window.location.href;

// if (authToken) {
//   fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       token: authToken,
//     }),
//   }).then((response) => {
//     if (response.status == 200) {
//       if (url.includes("?token=")) {
//         url = url.split("?")[0];
//         alert("Logged in!");
//       }

//       response.json().then((json) => {
//         generateCountdown(placeButton, json.cooldown);
//       });
//     } else {
//       response.text().then((text) => {
//         displayErrorMessage(text);
//       });
//     }
//   });
// } else {
//   if (url.includes("?token=")) {
//     const queryString = url.split("?").pop();

//     const token = queryString.split("token=").pop();

//     if (token) {
//       document.cookie = `token=${token};max-age=31536000`;
//       url = url.split("?")[0];
//     }
//   }
// }
