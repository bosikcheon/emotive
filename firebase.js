import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js';
import { getDatabase, ref, get, set, update, remove, push, query, orderByChild, equalTo, serverTimestamp, runTransaction } from 'https://www.gstatic.com/firebasejs/13.0.0/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDUWIJf-HDonLdlm3aZs0qcUmSx8iFTHuY',
  authDomain: 'emotive-71134.firebaseapp.com',
  projectId: 'emotive-71134',
  databaseURL: 'https://emotive-71134-default-rtdb.asia-southeast1.firebasedatabase.app',
  storageBucket: 'emotive-71134.firebasestorage.app',
  messagingSenderId: '17304234593',
  appId: '1:17304234593:web:6a58a5131e6a3469c99820'
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const observeAuth = callback => onAuthStateChanged(auth, callback);
export const logout = () => signOut(auth);
export const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
const stamp = () => serverTimestamp();
const date = value => typeof value==='number' ? new Date(value).toLocaleDateString('ko-KR') : '';
const mapRecords = snapshot => {
  const records=[];
  snapshot?.forEach(child=>{const data=child.val();records.push({...data,id:child.key,date:date(data.createdAt)});});
  return records;
};
export async function ensureProfile(user) {
  const profileRef = ref(db,`users/${user.uid}`);
  let snapshot = await get(profileRef);
  if (!snapshot.exists()) {
    await runTransaction(profileRef,current=>current===null?{name:user.displayName || '새로운 친구',email:user.email,role:'member',createdAt:stamp()}:undefined,{applyLocally:false});
    snapshot = await get(profileRef);
  }
  return {...snapshot.val(),id:user.uid,date:date(snapshot.val().createdAt)};
}
export async function signup(email,password,name) {
  const result = await createUserWithEmailAndPassword(auth,email,password);
  await updateProfile(result.user,{displayName:name});
  await ensureProfile(result.user);
  await update(ref(db,`users/${result.user.uid}`),{name});
  return result.user;
}
export async function loadData(profile) {
  const result = await Promise.all([
    get(profile?.role==='admin'?ref(db,'works'):query(ref(db,'works'),orderByChild('visible'),equalTo(true))),
    get(ref(db,'posts')),
    profile?.role==='admin'?get(ref(db,'users')):Promise.resolve(null),
    profile?get(ref(db,`likes/${profile.id}`)):Promise.resolve(null),
    profile?get(ref(db,`cart/${profile.id}`)):Promise.resolve(null)
  ]);
  return {works:mapRecords(result[0]).sort((a,b)=>(a.order??999)-(b.order??999)),posts:mapRecords(result[1]).sort((a,b)=>(a.createdAt??0)-(b.createdAt??0)),users:result[2]?mapRecords(result[2]):profile?[profile]:[],liked:mapRecords(result[3]).map(item=>item.id),cart:mapRecords(result[4]).map(item=>({id:item.id,qty:item.qty}))};
}
const uid = () => {if(!auth.currentUser)throw Error('로그인이 필요합니다.');return auth.currentUser.uid;};
const safeKey = id => {const key=String(id);if(!key||/[.#$\[\]/]/.test(key))throw Error('잘못된 데이터 ID입니다.');return key;};
export async function setLike(id,active) {const itemRef=ref(db,`likes/${uid()}/${safeKey(id)}`);return active?set(itemRef,{createdAt:stamp()}):remove(itemRef);}
export async function setCart(id,qty) {const itemRef=ref(db,`cart/${uid()}/${safeKey(id)}`);return qty>0?set(itemRef,{qty:Math.min(99,qty)}):remove(itemRef);}
export const changeWork = (id,changes) => update(ref(db,`works/${safeKey(id)}`),changes);
export async function addWork(work) {const itemRef=push(ref(db,'works'));await set(itemRef,{...work,createdAt:stamp()});return itemRef.key;}
export async function importExamples(examples) {
  for(const [index,work] of examples.entries()) {
    const {id,...data}=work;
    await runTransaction(ref(db,`works/${safeKey(id)}`),current=>current===null?{...data,order:index,createdAt:stamp()}:undefined,{applyLocally:false});
  }
}
export async function addPost(text,name) {const itemRef=push(ref(db,'posts'));await set(itemRef,{text,name,userId:uid(),reply:'',createdAt:stamp()});}
export const removePost = id => remove(ref(db,`posts/${safeKey(id)}`));
export const replyPost = (id,reply) => update(ref(db,`posts/${safeKey(id)}`),{reply});
export const changeName = name => update(ref(db,`users/${uid()}`),{name});
export function errorMessage(error) {
  const messages = {'auth/email-already-in-use':'이미 가입된 이메일입니다.','auth/invalid-credential':'이메일 또는 비밀번호를 확인해 주세요.','auth/invalid-email':'이메일 형식을 확인해 주세요.','auth/weak-password':'더 안전한 비밀번호를 입력해 주세요.','auth/operation-not-allowed':'Firebase 콘솔에서 이메일/비밀번호 로그인을 활성화해 주세요.','auth/too-many-requests':'요청이 많습니다. 잠시 후 다시 시도해 주세요.','auth/network-request-failed':'인터넷 연결을 확인해 주세요.','permission-denied':'Realtime Database 보안 규칙 또는 회원 권한을 확인해 주세요.','unavailable':'Firebase에 연결하지 못했습니다. 인터넷 연결과 데이터베이스 URL을 확인해 주세요.','failed-precondition':'Realtime Database 설정을 확인해 주세요.'};
  const code=String(error.code||'').toLowerCase().replace(/_/g,'-');
  if(code.includes('permission-denied'))return messages['permission-denied'];
  return messages[code] || error.message || '요청을 처리하지 못했습니다.';
}
