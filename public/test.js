$(function () {

    //

    var twitterApi = new TwitterApi();

    //

    var getFollowers;
    var getUserInfo;
    var getSuggestions;

    //

    var user = 'stevebrowndotco';

    //

    var container, stats;
    var camera, scene, projector, renderer;
    var fastRotating = true;

    var PI2 = Math.PI * 2;


    var height = window.innerHeight - 300;

    var programFill = function (context) {
        context.beginPath();
        context.arc(0, 0, 1.05, 0, PI2, true);
        context.closePath();
        context.fill();
    }

    var programStroke = function (context) {
        context.lineWidth = 0.05;
        context.beginPath();
        context.arc(0, 0, 1, 0, PI2, true);
        context.closePath();
        context.fill();
        context.stroke();
    }

    var mouse = { x:0, y:0 }, INTERSECTED;
    var maxParticles = 999;
    var popupText;

    var radius = 600;
    var theta = 0;

    var blob = new Blob();

    // Triggers

    var renderTweetInfo = new RenderTweetInfo();

    $('#suggestions a').bind('click', function(e){
        e.preventDefault();
        clearScene();
        var selectedUser = $(e.target).attr('href');
        setupUser(selectedUser);

    })

    $('#startButton').bind('click', function(){

        user = $('#userInput').val();
        clearScene();
        setupUser(user);

    })

    $('#userInput').keypress(function (e) {

        user = $('#userInput').val();
        if (e.which == 13) {
            clearScene();
            setupUser(user);
        }

    });

    //

    function setupUser(user) {

        // This function was originally polling the streaming API every 200ms, however now it works for individual
        // twitter users via the REST API by entering in a username.
        //
        // There was an operational reason for this. I originally needed to have a persistent connection open for the
        // streaming API, and utlize OAuth.
        //
        // I was able to do this for a web page with ONE user as we needed the server (in this case MAMP) to run using
        // a while loop in another tab.
        //
        // This was not efficient enough for multiple users viewing the demo at one time. This is why I chose a closed
        // method.

        //Initial Query

        var followers = 0;
        var maximumReach = 0;
        var averageFollowers = 0;

        getUserInfo = twitterApi.response('users/show.json?screen_name='+user, function(item) {

            followers = item.followers_count;

            var userImage = item.profile_image_url.replace('_normal','');

            $('#userAvatar').attr('style','background-image: url('+userImage+')');

            $('#userInfo h2').html(item.screen_name);
            $('#userInfo #fullName').html(item.name);
            $('#userInfo #description').html(item.description);
            $('#userInfo #followers .value').html(item.followers_count);
            $('#userInfo #location .value').html(item.location);

        })

        getFollowers = twitterApi.response('statuses/friends.json?screen_name='+user, function(data){

            $.each(data, function(count,item){
                renderTweet(item);
            });

        });

    }

    function init() {

        // Set the Camera

        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 300, 500);

        // Set the scene

        scene = new THREE.Scene();

        // Set the projector

        projector = new THREE.Projector();

        // Set the renderer

        renderer = new THREE.CanvasRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Add to DOM

        $('#container').html(renderer.domElement);

        // Material Depth

        material_depth = new THREE.MeshDepthMaterial();

        //Popup Text

        popupText = new PopupText();

        //Event Listeners

        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener( 'mousedown', onDocumentMouseDown, false );

        //

        window.addEventListener('resize', onWindowResize, false);


    }

    //

    function TwitterApi() {

        var twitterApiVersion = 1;

        this.apiUrl = 'http://api.twitter.com/' + twitterApiVersion +'/';
        this.response = function (query, callback) {

            query += '&include_entities=1&callback=?';

            $.getJSON(this.apiUrl+query,
                function(data) {
                    callback(data);
                }
            );

        };

    }

    function renderTweet(item) {
        blob.create(item);
        importanceColor = getImportanceColor(item.followers_count);
        followersCount = getFollowersCount(item.followers_count, 255)
    }

    function getFollowersCount(number, limit) {
        count = Math.floor(4 * (Math.log(number)))
        return count;
    }

    function getImportanceColor(number) {
        rgb = 255 - Math.floor(16 * (Math.log(number + 1) + 1));
        return 'rgb(' + rgb + ',0,0)';
    }

    //

    function Blob(item) {

        this.create = function (item) {

            var blobSize = getFollowersCount(item.followers_count, 255);

            var particle = new THREE.Particle(new THREE.ParticleCanvasMaterial({ color:Math.random() * 0x808080 + 0x808080, program:programStroke }));
            particle.position.x = Math.random() * 800 - 400;
            particle.position.y = Math.random() * 800 - 400;
            particle.position.z = Math.random() * 800 - 400;
            particle.scale.x = particle.scale.y = blobSize;
            particle.data = item;

            scene.add(particle);

        }

        this.destroy = function () {
            scene.remove(item);
        }

    }

    function PopupText(data) {

        this.create = function (data) {
            $('#twitterPopup').html('<p>' + data.screen_name + '</p>');
        }

        this.destroy = function () {
            $('#twitterPopup').empty();
        }

    }

    // HELPERS

    function addCommas(nStr) {
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event) {
        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;
    }

    //


    function animate() {

        requestAnimationFrame(animate);
        render();

    }

    function render() {

        // rotate camera

        if (fastRotating == true) { theta += 0.2; } else { theta += 0.05 }

        camera.position.x = radius * Math.sin(theta * Math.PI / 360);
        camera.position.y = radius * Math.sin(theta * Math.PI / 360);
        camera.position.z = radius * Math.cos(theta * Math.PI / 360);
        camera.lookAt(scene.position);

        // find intersections

        camera.updateMatrixWorld();

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

        var intersects = ray.intersectObjects(scene.children);

        if (intersects.length > 0) {

            if (INTERSECTED != intersects[ 0 ].object) {

                if (INTERSECTED) INTERSECTED.material.program = programStroke;
                INTERSECTED = intersects[ 0 ].object;
                INTERSECTED.material.program = programFill;
                popupText.create(INTERSECTED.data);

                $('body').css('cursor','pointer');
                fastRotating = false;

            }

        } else {

            if (INTERSECTED) INTERSECTED.material.program = programStroke;
            INTERSECTED = null;
            fastRotating = true;
            $('body').css('cursor','inherit');

            popupText.destroy();

        }

        renderer.clear();
        renderer.render(scene, camera);

    }

    function clearScene() {

        var obj, i;
        for ( i = scene.children.length - 1; i >= 0 ; i -- ) {
            obj = scene.children[ i ];
            scene.remove(obj);
        }

    }

    function onDocumentMouseDown( event ) {

        camera.updateMatrixWorld();

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

        var intersects = ray.intersectObjects(scene.children);

        if (intersects.length > 0) {

            var isActive;

            if( $('#selectedTweet').hasClass('active') ) {
                isActive = true;
            } else {
                isActive = false;
            }

            renderTweetInfo.tweetContent(INTERSECTED.data, isActive);

        } else {

            renderTweetInfo.tweetContent('', false);

        }

    }

    function RenderTweetInfo(item, isActive) {

        this.tweetContent = function(item, isActive) {

            alert(isActive);
            if (item) {

                if (isActive == false) {
                    $('#selectedTweet').addClass('active', 300, 'swing');
                }

                var userImage = item.profile_image_url.replace('_normal','');

                $('#selectedTweet .userDetails h2').html(item.screen_name);
                $('#selectedTweet .userDetails p').html(item.name);
                $('#selectedTweet .tweetContents p#tweetCopy').html(item.status.text);
                $('#selectedTweet .tweetContents p#when').html(item.created_at);
                $('#selectedTweet .userDetails .user-avatar').attr('style','background-image: url('+userImage+')');

            } else {
                $('#selectedTweet').removeClass('active', 300, 'swing');
            }

        }

    }

    // Initiate the app

    setupUser(user);
    init();
    animate();

});

