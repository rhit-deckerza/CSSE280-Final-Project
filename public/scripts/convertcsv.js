var rhit = rhit || {};


rhit.arrayToCSV = function (data) {
	let csvContent = "data:text/csv;charset=utf-8,";
	data.forEach(function(rowArray) {
    	let row = rowArray.join(",");
    	csvContent += row + "\r\n";
	});
	rhit.downlaodCSV(csvContent);
	
};

rhit.downlaodCSV = function (csvContent) {
	var encodedUri = encodeURI(csvContent);
	window.open(encodedUri)
	// var encodedUri = encodeURI(csvContent);
	// var link = document.createElement("a");
	// link.setAttribute("href", encodedUri);
	// link.setAttribute("download", "my_Schedule.csv");
	// document.body.appendChild(link); // Required for FF
	// link.click();
};

rhit.main = function () {
	const data = [
		["Freshman", " ", " ", ""],
		["Fall", "CSSE120", "ME123", "MA111", "HSSA"],
		["Winter", "MA212", "MA212", "CSSE220", "ME480"],
		["Spring", "MA212", "ME123", "CSSE280", "HSSA"]
	];

	document.querySelector("#exportToForm").onclick = (event) => {
		rhit.arrayToCSV(data);	
	}
};

rhit.main();