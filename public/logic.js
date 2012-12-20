$(function () {

    //

    var twitterApi = new TwitterApi();

    //

    var getUserInfo;


    //

    var user = 'stevebrowndotco';

    //

    var container, stats;
    var camera, scene, projector, renderer;
    var fastRotating = true;

    var material_depth, cubeMaterial;
    var PI2 = Math.PI * 2;
    var postprocessing = { enabled:false };

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
    var popupText;

    var radius = 600;
    var theta = 0;

    var blob = new Blob();

    //

    var renderTweetInfo = new RenderTweetInfo();

    function setupUser(user) {

        //Initial Query

        var followers = 0;


        getUserInfo = twitterApi.response('users/show.json?screen_name=' + user, function (item) {

            followers = item.followers_count;

            var userImage = item.profile_image_url.replace('_normal', '');

            $('#userAvatar').attr('style', 'background-image: url(' + userImage + ')');

            $('#userInfo h2').html(item.screen_name);
            $('#userInfo #fullName').html(item.name);
            $('#userInfo #description').html(item.description);
            $('#userInfo #followers .value').html(item.followers_count);
            $('#userInfo #location .value').html(item.location);

        })


        var socket = io.connect('http://localhost:3000');
        socket.on('tweets', function (data) {
            renderTweet(data)
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
        document.addEventListener('mousedown', onDocumentMouseDown, false);

        //

        window.addEventListener('resize', onWindowResize, false);


        initPostprocessing();
    }

    //

    function TwitterApi() {

        var twitterApiVersion = 1;

        this.apiUrl = 'http://api.twitter.com/' + twitterApiVersion + '/';
        this.response = function (query, callback) {

            query += '&include_entities=1&callback=?';

            $.getJSON(this.apiUrl + query,
                function (data) {
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

            var blobSize = getFollowersCount(item.followers, 255);

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

    // HELPER

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

    function initPostprocessing() {

        postprocessing.scene = new THREE.Scene();

        postprocessing.camera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -10000, 10000);
        postprocessing.camera.position.z = 100;

        postprocessing.scene.add(postprocessing.camera);

        var pars = { minFilter:THREE.LinearFilter, magFilter:THREE.LinearFilter, format:THREE.RGBFormat };
        postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget(window.innerWidth, height, pars);
        postprocessing.rtTextureColor = new THREE.WebGLRenderTarget(window.innerWidth, height, pars);

        var bokeh_shader = THREE.BokehShader;

        postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone(bokeh_shader.uniforms);

        postprocessing.bokeh_uniforms[ "tColor" ].value = postprocessing.rtTextureColor;
        postprocessing.bokeh_uniforms[ "tDepth" ].value = postprocessing.rtTextureDepth;
        postprocessing.bokeh_uniforms[ "focus" ].value = 1.1;
        postprocessing.bokeh_uniforms[ "aspect" ].value = window.innerWidth / height;

        postprocessing.materialBokeh = new THREE.ShaderMaterial({

            uniforms:postprocessing.bokeh_uniforms,
            vertexShader:bokeh_shader.vertexShader,
            fragmentShader:bokeh_shader.fragmentShader

        });

        postprocessing.quad = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), postprocessing.materialBokeh);
        postprocessing.quad.position.z = -500;
        postprocessing.scene.add(postprocessing.quad);

    }

    function animate() {

        requestAnimationFrame(animate);
        render();

    }

    function render() {

        // rotate camera

        if (fastRotating == true) {
            theta += 0.2;
        } else {
            theta += 0.05
        }

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

                $('body').css('cursor', 'pointer');
                fastRotating = false;

            }

        } else {

            if (INTERSECTED) INTERSECTED.material.program = programStroke;
            INTERSECTED = null;
            fastRotating = true;
            $('body').css('cursor', 'inherit');

            popupText.destroy();

        }

        if (postprocessing.enabled) {

            renderer.clear();

            // Render scene into texture

            scene.overrideMaterial = null;
            renderer.render(scene, camera, postprocessing.rtTextureColor, true);

            // Render depth into texture

            scene.overrideMaterial = material_depth;
            renderer.render(scene, camera, postprocessing.rtTextureDepth, true);

            // Render bokeh composite

            renderer.render(postprocessing.scene, postprocessing.camera);


        } else {

            renderer.clear();
            renderer.render(scene, camera);

        }

    }

    $('#startButton').bind('click', function () {
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

    function clearScene() {

        var obj, i;
        for (i = scene.children.length - 1; i >= 0; i--) {
            obj = scene.children[ i ];
            scene.remove(obj);
        }

    }

    function onDocumentMouseDown(event) {

        /* 	event.preventDefault(); */

        camera.updateMatrixWorld();

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

        var intersects = ray.intersectObjects(scene.children);

        if (intersects.length > 0) {

            var isActive;

            if ($('#selectedTweet').hasClass('active')) {
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

        this.tweetContent = function (item, isActive) {

            if (item) {

                if (isActive == false) {
                    $('#selectedTweet').addClass('active', 300, 'swing');
                }

                var userImage = item.profile_image_url.replace('_normal', '');

                console.log(item);
                $('#selectedTweet .userDetails h2').html(item.screen_name);
                $('#selectedTweet .userDetails p').html(item.name);
                $('#selectedTweet .tweetContents p#tweetCopy').html(item.status.text);
                $('#selectedTweet .tweetContents p#when').html(item.created_at);
                $('#selectedTweet .userDetails .user-avatar').attr('style', 'background-image: url(' + userImage + ')');

            } else {
                $('#selectedTweet').removeClass('active', 300, 'swing');
            }

        }

    }

    $('#suggestions a').bind('click', function (e) {
        e.preventDefault();
        clearScene();

        var selectedUser = $(e.target).attr('href');
        setupUser(selectedUser);
    })

    // Initiate the app

    setupUser(user);
    init();
    animate();

});


