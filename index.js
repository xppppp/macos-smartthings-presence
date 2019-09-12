(function _msp_init(port, interval, debug, init) {
    const netList = require('network-list');
    const express = require('express');
    let scoreboard = {
    };
    if (init) {
	init.split(',').forEach((mac) => {
	    scoreboard[mac] = { here: true };
	});
    }
    function dbg(msg) {
	if (debug) {
	    console.log(msg);
	}
    }
    function oneScan() {
	dbg('Begin one scan...');
	netList.scan({}, (serr, sres) => {
	    if (!serr) {
		dbg('One scan done...');
		let nresults = {};
		sres.forEach((relt) => {
		    if (relt.alive) {
			nresults[relt.mac] = { ip: relt.ip, vendor: relt.vendor,
					       alive: relt.alive };
		    }
		});
		scoreboard = nresults;
	    } else {
		console.log('scan error: ' + JSON.stringify(serr));
	    }
	    dbg('Back in ' + interval);
	    setTimeout(oneScan, interval * 1000);
	});
    }

    oneScan();
    const app = express();
    app.get('/present/:target', (req, res) => {
	let answer = { success: true, present: false };
	if (req.params && req.params.target && scoreboard[req.params.target]) {
	    answer.present = scoreboard[req.params.target].alive;
	    if (debug) {
		answer.additional =
		    JSON.stringify(scoreboard[req.params.target]);
	    }
	    dbg('response: ' + req.params.target + ' ' +
		((answer.present) ? 'present' : 'gone'));
	} else {
	    dbg('response: ' + req.params.target + ' missing');
	}
	res.send(answer);
    });
    app.get('/ayt', (req, res) => res.send('Yes.'));
    app.listen(port, () => {
	dbg('macos-smartthings-presence listening on port ' + port);
    });
})(process.env.PORT || 54321,
   process.env.INTERVAL || 15,
   process.env.DEBUG || 0,
   process.env.PRESENT || '');
