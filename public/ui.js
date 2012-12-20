var uiController = {
	stats: true,
	changeHashTag: true,
	settings: false
}


$(document).ready(function() {
	$('.drawer').bind('click', function() {
		$('#foldDown').toggleClass('active', 300, 'swing');
	})
	
	function setUI() {
		
	}
	
	setUI();
})
