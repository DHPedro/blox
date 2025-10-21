import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, get, onValue, push, remove, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
const firebaseConfig = {
  //tira os olhos das minhas credenciais criança
  apiKey: "AIzaSyCjRh4tnsysSOC4FUnVWSeerTKojzQPivI",

  authDomain: "blox-1c871.firebaseapp.com",

  databaseURL: "https://blox-1c871-default-rtdb.firebaseio.com",

  projectId: "blox-1c871",

  storageBucket: "blox-1c871.firebasestorage.app",

  messagingSenderId: "191155180771",

  appId: "1:191155180771:web:46de8a77f3144b6ebb21d6",

  measurementId: "G-1H9H9H4JFC"

};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app); 

const partidasRef = ref(database, 'partidas'); 

export { 
    auth, 
    partidasRef, 
    onValue, 
    push, 
    ref, 
    get, 
    database,
    remove, 
    update, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
};