const credentials = require("./credentials");

let app = {
  init: null,
  firebase: {
    config: {
      apiKey: credentials.apiKey,
      authDomain: credentials.authDomain,
      databaseURL: credentials.databaseURL,
      projectId: credentials.projectId,
      storageBucket: credentials.storageBucket,
      messagingSenderId: credentials.messagingSenderId,
      appId: credentials.appId
    },
    db: null
  },
  loginUser: {
    id: "",
    name: "",
    email: "Rita@gmail.com",
    friendList: [],
    Invitation: [], // 使用者送出的邀請
    awaitInvitation: [] //使用者尚未答覆的邀請
  },
  userArray: []
};

let lib = {};

app.init = () => {
  lib.getEle("#login-user").innerHTML = app.loginUser.email;
  app.firebase.db = firebase.firestore();
  app.getUserInfo(app.loginUser.email);
  lib.getEle("#find-user").addEventListener("blur", () => {
    app.findAllUser();
  });

  lib.getEle("#submit").addEventListener("click", e => {
    e.preventDefault();
    app.createArticle();
  });

  lib.getEle("#get-all-articles").addEventListener("click", e => {
    e.preventDefault();
    app.getAllArticle("all");
  });

  lib.getEle("#get-self-articles").addEventListener("click", e => {
    e.preventDefault();
    app.getAllArticle("self");
  });
};

// 取得使用者的資料
app.getUserInfo = email => {
  let result = new Promise((resolve, reject) => {
    app.firebase.db
      .collection("users")
      .where("user_email", "==", email)
      .get()
      .then(querySnapshot => {
        app.loginUser.friendList = [];

        querySnapshot.forEach(user => {
          app.loginUser.id = user.id;
          app.loginUser.name = user.data().user_name;
          app.loginUser.friendList = user.data().friend_list;
        });
        app.setFreindDDL();
        resolve();
      })
      .catch(error => {
        console.log("Error getting documents: ", error);
      });
  });
  return result;
};

// 設定朋友下拉式選單
app.setFreindDDL = () => {
  let friendDDL = lib.getEle("#select-friend");
  lib.removeEle(friendDDL); //reset ddl
  // add ddl list
  lib.createEle(
    "option",
    { atrs: { value: "", innerHTML: "Please Select" } },
    friendDDL
  );

  app.firebase.db
    .collection("users")
    .get()
    .then(result => {
      result.forEach(user => {
        if (app.loginUser.friendList.indexOf(user.id) > -1) {
          lib.createEle(
            "option",
            { atrs: { value: user.id, innerHTML: user.data().user_email } },
            friendDDL
          );
        }
      });
    })
    .catch(error => {
      console.log("Error getting documents: ", error);
    });
};

// 搜尋所有使用者
app.findAllUser = () => {
  let key = lib
    .getEle("#find-user")
    .value.trim()
    .toLowerCase();
  if (key !== "") {
    app.userArray = [];
    app.firebase.db
      .collection("users")
      .get()
      .then(result => {
        result.forEach(user => {
          if (
            user.id !== app.loginUser.id &&
            user
              .data()
              .user_email.toLowerCase()
              .indexOf(key) > -1
          ) {
            app.userArray.push({
              id: user.id,
              name: user.data().user_name,
              email: user.data().user_email
            });
          }
        });
        app.createUserList();
      })
      .catch(error => {
        console.log("Error getting documents: ", error);
      });
  } else {
    let userlist = lib.getEle("#user-list");
    lib.removeEle(userlist);
  }
};

// 產生 user list
app.createUserList = () => {
  let userlist = lib.getEle("#user-list");
  //check friends state
  const checkStatus = async () => {
    await app.getInvitation();
    await app.getAwaitInvitation();
  };
  checkStatus().then(() => {
    lib.removeEle(userlist);
    app.userArray.forEach(user => {
      let divObj = lib.createEle("div", {}, userlist);
      lib.createEle("span", { atrs: { textContent: user.name } }, divObj);
      lib.createEle(
        "span",
        { atrs: { textContent: " | " + user.email + "\n\n\n" } },
        divObj
      );

      if (app.loginUser.friendList.indexOf(user.id) > -1) {
        // friends
        lib.createEle(
          "span",
          {
            atrs: { textContent: " (Friend)", className: "font-desc" }
          },
          divObj
        );
      } else if (
        app.loginUser.Invitation.filter(item => item.userid === user.id)
          .length > 0
      ) {
        // 已送出交友邀請
        let inviteID = app.loginUser.Invitation.filter(
          item => item.userid === user.id
        )[0].id;
        lib.createEle(
          "button",
          {
            atrs: { innerHTML: "Cancel Invitation" },
            evts: { click: () => app.cancelFriend(inviteID) }
          },
          divObj
        );
      } else if (
        app.loginUser.awaitInvitation.filter(item => item.userid === user.id)
          .length > 0
      ) {
        // 答覆＆拒絕交友邀請
        lib.createEle(
          "button",
          {
            atrs: {
              innerHTML: "Accept Invitation"
            },
            evts: { click: () => app.acceptFriend(user.id) }
          },
          divObj
        );
        lib.createEle(
          "button",
          {
            atrs: { innerHTML: "Reject Invitation" },
            evts: {
              click: () => {
                app.rejectFriend(user.id);
              }
            }
          },
          divObj
        );
      } else {
        // 加入好友
        lib.createEle(
          "button",
          {
            atrs: { innerHTML: "Add As Friend" },
            evts: {
              click: () => {
                app.addFriend(user.id);
              }
            }
          },
          divObj
        );
      }
    });
  });
};

// 尚未答覆邀請的 user
app.getInvitation = () => {
  let result = new Promise((resolve, reject) => {
    app.firebase.db
      .collection("invite")
      .where("invitee", "==", app.loginUser.id)
      .get()
      .then(querySnapshot => {
        app.loginUser.awaitInvitation = [];
        querySnapshot.forEach(item => {
          app.loginUser.awaitInvitation.push({
            id: item.id,
            userid: item.data().inviter
          });
        });
        resolve();
      })
      .catch(error => {
        console.log("Error getting documents: ", error);
      });
  });
  return result;
};

// 送邀請但尚未接受的 user
app.getAwaitInvitation = () => {
  let result = new Promise((resolve, reject) => {
    app.firebase.db
      .collection("invite")
      .where("inviter", "==", app.loginUser.id)
      .get()
      .then(querySnapshot => {
        app.loginUser.Invitation = [];
        querySnapshot.forEach(item => {
          app.loginUser.Invitation.push({
            id: item.id,
            userid: item.data().invitee
          });
        });
        resolve();
      })
      .catch(error => {
        console.log("Error getting documents: ", error);
      });
  });
  return result;
};

// 取消申請好友
app.cancelFriend = inviteID => {
  app.firebase.db
    .collection("invite")
    .doc(inviteID)
    .delete()
    .then(function() {
      app.findAllUser(); // 重新刷新 list
    })
    .catch(function(error) {
      console.error("Error removing document: ", error);
    });
};

// 接受好友邀請
app.acceptFriend = userID => {
  //check friends state
  const checkStatus = async () => {
    //加入雙方好友清單
    await app.updateFriendList(app.loginUser.id, userID);
    await app.updateFriendList(userID, app.loginUser.id);
    //從 invite table 刪除申請
    let inviteID = app.loginUser.awaitInvitation.filter(
      item => item.userid === userID
    )[0].id;
    await app.deleteInvite(inviteID);
    //更新好友清單
    await app.getUserInfo(app.loginUser.email);
  };
  checkStatus().then(() => {
    app.findAllUser(); // 重新刷新 list
  });
};

// 拒絕好友邀請
app.rejectFriend = userID => {
  //從 invite table 刪除申請
  let inviteID = app.loginUser.awaitInvitation.filter(
    item => item.userid === userID
  )[0].id;
  app.deleteInvite(inviteID).then(() => {
    app.findAllUser(); // 重新刷新 list
  });
};

// 更新好友清單
app.updateFriendList = (user1, user2) => {
  let result = new Promise((resolve, reject) => {
    app.firebase.db
      .collection("users")
      .doc(user1)
      .get()
      .then(item => {
        let NewfriendList = item.data().friend_list;
        NewfriendList.push(user2);
        app.firebase.db
          .collection("users")
          .doc(user1)
          .update({
            friend_list: NewfriendList
          });
        resolve();
      })
      .catch(error => {
        console.log("Error getting documents: ", error);
      });
  });
  return result;
};

// 刪除 invite
app.deleteInvite = inviteID => {
  let result = new Promise((resolve, reject) => {
    app.firebase.db
      .collection("invite")
      .doc(inviteID)
      .delete()
      .then(function() {
        resolve();
      })
      .catch(function(error) {
        console.error("Error removing document: ", error);
      });
  });
  return result;
};

// 加入好友
app.addFriend = userID => {
  //新增一筆 invite
  app.firebase.db
    .collection("invite")
    .add({
      invitee: userID,
      inviter: app.loginUser.id
    })
    .then(() => {
      app.findAllUser(); // 重新刷新 list
    });
};

// 新增文章
app.createArticle = () => {
  let form = lib.getEle("#articlePostForm");
  const date = firebase.firestore.FieldValue.serverTimestamp(); // timestamp
  let selectCB = lib.getAllEle("input[name=article_tag]:checked");
  let checkArticleTag = selectCB[0].value;

  app.firebase.db.collection("articles").add({
    article_title: form.article_title.value,
    article_content: form.article_content.value,
    article_tag: checkArticleTag,
    author: app.loginUser.id, // 預設是 Teresa 這個人發出去的 // Rita 動態產生
    created_time: date
  });
};

// 顯示文章
app.getAllArticle = type => {
  let div_articles = lib.getEle("#article-list");
  let articleConn = app.firebase.db.collection("articles");

  //顯示自己的文章
  if (type === "self") {
    articleConn = articleConn.where("author", "==", app.loginUser.id);
  }

  articleConn
    .get()
    .then(result => {
      lib.removeEle(div_articles);
      result.forEach(item => {
        let divObj = lib.createEle(
          "div",
          { atrs: { className: "article" } },
          div_articles
        );
        lib.createEle(
          "span",
          { atrs: { textContent: item.data().article_title } },
          divObj
        );
        lib.createEle(
          "span",
          { atrs: { textContent: " / Tag : " + item.data().article_tag } },
          divObj
        );
        lib.createEle(
          "span",
          { atrs: { textContent: " / Author : " + item.data().author } },
          divObj
        );
        lib.createEle(
          "div",
          { atrs: { textContent: item.data().article_content } },
          divObj
        );
      });
    })
    .catch(error => {
      console.log("Error getting documents: ", error);
    });
};

// 搜尋特定 tag 文章
app.getTagFriendArticle = () => {
  let tagname = lib.getEle("#select-tag").options[
    lib.getEle("#select-tag").options.selectedIndex
  ].value;
  let friend = lib.getEle("#select-friend").options[
    lib.getEle("#select-friend").options.selectedIndex
  ].value;

  let div_articles = lib.getEle("#article-list");
  let articleObj = app.firebase.db.collection("articles");

  if (tagname !== "") {
    articleObj = articleObj.where("article_tag", "==", tagname);
  }
  if (friend !== "") {
    articleObj = articleObj.where("author", "==", friend);
  }

  articleObj
    .get()
    .then(result => {
      lib.removeEle(div_articles);
      result.forEach(item => {
        let divObj = lib.createEle(
          "div",
          { atrs: { className: "article" } },
          div_articles
        );
        lib.createEle(
          "span",
          { atrs: { textContent: item.data().article_title } },
          divObj
        );
        lib.createEle(
          "span",
          { atrs: { textContent: " / Tag : " + item.data().article_tag } },
          divObj
        );
        lib.createEle(
          "span",
          { atrs: { textContent: " / Author : " + item.data().author } },
          divObj
        );
        lib.createEle(
          "div",
          { atrs: { textContent: item.data().article_content } },
          divObj
        );
      });
    })
    .catch(error => {
      console.log("Error getting documents: ", error);
    });
};

firebase.initializeApp(app.firebase.config);
window.addEventListener("DOMContentLoaded", app.init);
