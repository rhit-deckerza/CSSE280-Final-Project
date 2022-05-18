const csv = require('csv-parser')
const fs = require('fs')
const firebase = require('firebase')
require('firebase/firestore')
const results = [];

const firebaseConfig = {
    apiKey: "AIzaSyDuCfDDyK-qacIb8VBOZ-V65s3L8zxiEb8",
    authDomain: "finalproject-598d9.firebaseapp.com",
    projectId: "finalproject-598d9",
    storageBucket: "finalproject-598d9.appspot.com",
    messagingSenderId: "331462681582",
    appId: "1:331462681582:web:a24e172fa990ee0a6c64ff",
    measurementId: "G-R9REN4MQ8F"
};
let classes = [];
const classname = 'ClassName';
fs.createReadStream('data.csv')
.pipe(csv(['ClassName','poop', 'Subtitle']))
.on('data', (data) => results.push(data))
.on('end', () => {
    for (let i = 0; i < results.length; i++) {
        let stringToAdd = results[i].ClassName.trim() + ':' + results[i].Subtitle;
        if (stringToAdd.length > 1){
            classes.push(stringToAdd);
        }
    }
    console.log(classes);
    const app = firebase.initializeApp(firebaseConfig);
    const db = app.firestore();
    db.collection("Majors").doc("Computer Science").set({
        Classes: classes
    })
    
});




