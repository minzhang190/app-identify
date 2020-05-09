var spinner = document.getElementById('spinner');
var error = document.getElementById('error');
var inputName = document.getElementById('inputName');
var gaCheck = document.getElementById('gaCheck');

var interval = setInterval(() => {
    if (!window.ga || !window.ga.getAll) {
        console.log('Waiting for window.ga to be available...');
        return;
    }

    clearInterval(interval);
    gaCheck.hidden = true;

    var queryId = location.search ? location.search.substring(1).split('&')[0] : null;
    var trackerId = ga.getAll().map(tracker => tracker.get('clientId')).filter(x => x).pop();
    var clientId = trackerId || 'unknown';
    var nameCollection = firebase.firestore().collection('users').doc(clientId).collection('identify-names');
    var tokenCollection = firebase.firestore().collection('users').doc(clientId).collection('identify-tokens');

    function updateList() {
        nameCollection.orderBy('time', 'desc').limit(3).get().then(querySnapshot => {

            spinner.hidden = true;

            if (querySnapshot.size == 0) {
                var listItem = document.createElement('li');
                listItem.textContent = '(None)';
                list.appendChild(listItem);
                return;
            }

            querySnapshot.forEach(doc => {
                var data = doc.data();
                var listItem = document.createElement('li');
                var nameNode = document.createTextNode(data.name);
                var timeSpan = document.createElement('span');
                timeSpan.classList.add('text-muted');
                timeSpan.textContent = ' @ ' + data.time.toDate().toLocaleString();
                listItem.appendChild(nameNode);
                listItem.appendChild(timeSpan);
                list.appendChild(listItem);
            });
        });
    }

    function insertName(e) {
        e.preventDefault();
        var buttons = document.getElementsByTagName('button');
        Array.prototype.forEach.call(buttons, btn => btn.innerText = '...');

        nameCollection.add({
            name: inputName.value,
            time: firebase.firestore.FieldValue.serverTimestamp()
        }).then(docRef => {
            Array.prototype.forEach.call(buttons, btn => btn.innerText = 'Saved successfully');

            inputName.value = '';
            list.textContent = '';
            spinner.hidden = false;
            updateList();
        });
    }

    document.getElementById('form').onsubmit = insertName;
    updateList();

    messaging.getToken().then(function(currentToken) {
        if (currentToken) {
            tokenCollection.add({
                token: currentToken,
                query: queryId,
                time: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    });

    messaging.onMessage(function(payload) {
        document.getElementById('message-heading').innerText = payload.notification.title;
        document.getElementById('message-body').innerText = payload.notification.body;
        document.getElementById('message').hidden = false;
    });
}, 100);
