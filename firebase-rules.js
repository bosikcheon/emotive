// firebase-setup.html에 표시되는 Realtime Database 규칙 JSON입니다.
// Firebase 콘솔 > Realtime Database > 규칙에 전체 JSON을 붙여넣고 게시하세요.
const admin = "auth != null && root.child('users').child(auth.uid).child('role').val() == 'admin'";
const owner = 'auth != null && auth.uid == $uid';
const nameRule = 'newData.isString() && newData.val().length > 0 && newData.val().length <= 20';
const immutable = '(!data.exists() || newData.val() == data.val())';
export const realtimeRules = JSON.stringify({
  rules: {
    '.read': false,
    '.write': false,
    users: {
      '.read': admin,
      '$uid': {
        '.read': owner,
        '.write': `${owner} && newData.exists()`,
        '.validate': "newData.hasChildren(['name','email','role','createdAt'])",
        name: {'.validate': nameRule},
        email: {'.validate': `newData.isString() && newData.val() == auth.token.email && ${immutable}`},
        role: {'.validate': "(!data.exists() && newData.val() == 'member') || (data.exists() && newData.val() == data.val())"},
        createdAt: {'.validate': 'newData.isNumber() && ((!data.exists() && newData.val() == now) || (data.exists() && newData.val() == data.val()))'},
        '$other': {'.validate': false}
      }
    },
    works: {
      '.read': `(${admin}) || (query.orderByChild == 'visible' && query.equalTo == true)`,
      '.write': admin,
      '.indexOn': ['visible'],
      '$workId': {
        '.read': "data.child('visible').val() == true",
        '.validate': "newData.hasChildren(['name','type','emotion','color','caption','status','visible','likes','createdAt'])",
        name: {'.validate': 'newData.isString() && newData.val().length > 0 && newData.val().length <= 45'},
        type: {'.validate': "newData.val() == '' || newData.val() == 'bear' || newData.val() == 'cat' || newData.val() == 'cloud'"},
        emotion: {'.validate': "newData.val() == '기쁨' || newData.val() == '위로' || newData.val() == '응원' || newData.val() == '사랑' || newData.val() == '공감' || newData.val() == '휴식'"},
        color: {'.validate': "newData.isString() && newData.val().matches(/^#[0-9a-fA-F]{6}$/)"},
        caption: {'.validate': 'newData.isString() && newData.val().length > 0 && newData.val().length <= 18'},
        status: {'.validate': "newData.val() == 'pending' || newData.val() == 'approved'"},
        visible: {'.validate': 'newData.isBoolean()'},
        likes: {'.validate': 'newData.isNumber() && newData.val() >= 0 && newData.val() % 1 == 0'},
        createdAt: {'.validate': 'newData.isNumber() && ((!data.exists() && newData.val() == now) || (data.exists() && newData.val() == data.val()))'},
        order: {'.validate': 'newData.isNumber() && newData.val() >= 0'},
        '$other': {'.validate': false}
      }
    },
    posts: {
      '.read': true,
      '$postId': {
        '.write': `auth != null && ((!data.exists() && newData.child('userId').val() == auth.uid && newData.child('name').val() == root.child('users').child(auth.uid).child('name').val() && newData.child('reply').val() == '') || (${admin}) || (!newData.exists() && data.child('userId').val() == auth.uid))`,
        '.validate': "newData.hasChildren(['text','name','userId','reply','createdAt'])",
        text: {'.validate': `newData.isString() && newData.val().length > 0 && newData.val().length <= 500 && ${immutable}`},
        name: {'.validate': `${nameRule} && ${immutable}`},
        userId: {'.validate': `newData.isString() && ${immutable}`},
        reply: {'.validate': 'newData.isString() && newData.val().length <= 500'},
        createdAt: {'.validate': 'newData.isNumber() && ((!data.exists() && newData.val() == now) || (data.exists() && newData.val() == data.val()))'},
        '$other': {'.validate': false}
      }
    },
    likes: {
      '$uid': {
        '.read': owner,
        '$workId': {
          '.write': `${owner} && (!newData.exists() || root.child('works').child($workId).exists())`,
          '.validate': "newData.hasChildren(['createdAt'])",
          createdAt: {'.validate': 'newData.isNumber() && newData.val() == now'},
          '$other': {'.validate': false}
        }
      }
    },
    cart: {
      '$uid': {
        '.read': owner,
        '$workId': {
          '.write': `${owner} && (!newData.exists() || root.child('works').child($workId).exists())`,
          '.validate': "newData.hasChildren(['qty'])",
          qty: {'.validate': 'newData.isNumber() && newData.val() >= 1 && newData.val() <= 99 && newData.val() % 1 == 0'},
          '$other': {'.validate': false}
        }
      }
    }
  }
}, null, 2);
