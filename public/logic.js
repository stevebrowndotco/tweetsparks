$(function () {

    var blobCounter = 0;
    var searchname = undefined;
    var local_id = guidGenerator();
    var container;
    var camera, scene, projector, renderer, ray;

    var light = new THREE.SpotLight();

    //

    var theta = 0;

    //

    var WIDTH = window.innerWidth;
    var HEIGHT = window.innerHeight;

    //

    var mouse = { x: 0, y: 0 }, INTERSECTED;
    var PARTICLE_SIZE = 20;

    //

    var blob = new Blob();

    var renderTweetInfo = new RenderTweetInfo();

    //

    var height = window.innerHeight - 300;
    var postprocessing = { enabled  : true };

    var particleCount = 10000;

    var sprite = THREE.ImageUtils.loadTexture( "/public/img/spark.png" );

    var geometry = new THREE.Geometry();

//    var radius = 100, segments = 68, rings = 38;
//
//    var geometry = new THREE.SphereGeometry( radius, segments, rings );

    console.log(geometry);

    var attributes, uniforms;

    // SHADER

    attributes = {

        size: {	type: 'f', value: [] },
        customColor: { type: 'c', value: [] }

    };

    uniforms = {

        amplitude: { type: "f", value: 1.0 },
        color:     { type: "c", value: new THREE.Color( 0xffffff ) },
        texture:   { type: "t", value: sprite }

    };

    var shader = new THREE.ShaderMaterial( {

        uniforms: 		uniforms,
        attributes:     attributes,
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        blending: 		THREE.AdditiveBlending,
        depthTest: 		true,
        transparent:	true

    });

    //

    var values_size = attributes.size.value;
    var values_color = attributes.customColor.value;

    for (var p = 0; p < particleCount; p++) {

        var particle = new THREE.Vector3(-9999, 1, 1  );

        values_size[ p ] = 10;
        values_color[ p ] = new THREE.Color( 0xf6004f);

        particle.data = [];

        geometry.vertices.push(particle);

    }

    var particleSystem = new THREE.ParticleSystem(geometry, shader);

    particleSystem.geometry.__dirtyVertices = true;
    particleSystem.geometry.__dirtyElements = true;
    particleSystem.geometry.boundingSphere.radius = 300;
    particleSystem.geometry.verticesNeedUpdate = true;
    particleSystem.sortParticles = true;
    particleSystem.dynamic = true;


    function init() {

        camera = new THREE.PerspectiveCamera( 40, WIDTH / HEIGHT, 1, 10000 );
        camera.position.z = 300;

        scene = new THREE.Scene();

        projector = new THREE.Projector();

        renderer = new THREE.WebGLRenderer( { clearColor: 0x111111, clearAlpha: 1 } );

        renderer.setSize(window.innerWidth, window.innerHeight);

        initPostprocessing();

        $('#container').html(renderer.domElement);

        light.position.set( 170, 330, -160 );

        scene.add(light);

        // Socket.IO listener and sender
         var socket = io.connect('http://tweetspark.theaudience.com:3000'); // PRODUCTION
        //var socket = io.connect('http://localhost:3000'); // DEVELOP

        socket.on('connect', function(){
          searchname = 'barackobama';
          socket.emit('adduser', local_id, 'barackobama');
          socket.emit('reqnick', 'barackobama'); // barackObama default
        });

        scene.add(particleSystem);

        // ---- IO.LISTENER ----
        socket.on('tweets', function (data) {

          if (data.text.toLowerCase().search(searchname) != -1) {
//            console.log('tweet '+searchname, data);
            createBlob(data);
          }

        });


        socket.on('userLockup', function(data, error){
            _.each(data, function(val, key){
                if (val.screen_name.toLowerCase() == searchname) {
                  changeUser(val);
                }
            });
        });

        socket.on('userStartLockup', function(data, error){
//          console.log('userStartLockup', data, error);
          changeUser(data[0]);
        })

        socket.on('startStreaming', function(data){
//          console.log('tweet on start', data);
//          console.log(data.text.toLowerCase().search(searchname), searchname);
          createBlob(data);
        });


        // ---- IO.SENDER ----

        // request new streaming
        $("#startButton").on('click', function(e){
//            console.log($("#userInput").val());
            clearScene();
            searchname = $("#userInput").val();
            socket.emit('reqnick', $("#userInput").val());
        });

        $("#suggestions").on('click', function(e){
            e.preventDefault();
            clearScene();
            searchname = $(e.target).attr('href')
            socket.emit('reqnick', $(e.target).attr('href'));
        });

    }

     // insert new image and data on new client request
    function createBlob(data) {
        blob.create(data);
    }

    function clearScene() {

        blobCounter = 0;

//        console.log(searchname,particleSystem);

        _.each(particleSystem.geometry.vertices, function(val, key){

            val.x = val.y = val.z = -99999;

        });


    }

    function changeUser(data) {

      var image = data.profile_image_url.replace('_normal', '');
      $('#userAvatar').css('background-image', 'url(' + image + ')');

      $("#screenname").html("<h2>"+data.name+"</h2>");
      $("#fullName").html(data.name);
      $("#description").html(data.description);
      $("#location").html(data.location);
      $("#followers").html(data.followers_count);
    }

    function guidGenerator() {
      var S4 = function() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
      };
      return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
    }

    function Blob(item) {

        this.create = function (item) {

//            console.log(item);

            var blobSize = item.followers;
            var blobColor = getImportanceColor(item.followers);

            var particle = geometry.vertices[blobCounter];

            if ((blobCounter +1)< geometry.vertices.length) {

                var fX = Math.random() * 500 - 250,
                    fY = Math.random() * 500 - 250,
                    fZ = Math.random() * 500 - 250


                var pX = 0,
                    pY = 0,
                    pZ = 0
                     

                blobCounter++;

                particle.x = pX;
                particle.y = pY;
                particle.z = pZ;

                particle.data = item;
                
                particle.finalCo = { x: fX, y: fY, z: fZ };
                
                particle.animating = true;

                values_size[blobCounter] = 20;

                values_color[blobCounter].setHSV(blobColor+ 0.4, blobColor+ 0.4, 0.8);


            } else if (blobCounter > 0) {

                blobCounter = 0;

                particle.x = -99999;
                particle.y = -0;
                particle.z = -0;
                particle.data = []


            }

        }
        this.destroy = function () {

            scene.remove(item);

        }

    }

    function getImportanceColor(number) {
        rgb = (Math.log(number) / 10);
        return rgb;
    }

    function RenderTweetInfo() {

        this.tweetContent = function(item, isActive) {

            if (item) {

                if (isActive == false) {
                    $('#selectedTweet').addClass('active', 300, 'swing');
                }


                var userImage = item.data.image;

                console.log(item.data);

                $('#selectedTweet .tweetContents h2').html('<a href="http://twitter.com/'+item.data.original.user.screen_name+'/status/'+item.data.original.id_str+'" target="_blank">'+item.data.user+'</a>');
                $('#selectedTweet .tweetContents p#screen-name').html(item.data.original.user.screen_name);
                $('#selectedTweet .tweetContents p#tweetCopy').html(item.data.text);
                $('#selectedTweet .tweetContents p#when').html(item.data.created_at);
                $('#selectedTweet .userDetails .user-avatar').attr('style','background-image: url('+userImage+')');

            } else {
                $('#selectedTweet').removeClass('active', 300, 'swing');
            }

        }

    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseDown( event ) {

        camera.updateMatrixWorld();

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

        var intersects = ray.intersectObjects(scene.children);

        if (intersects.length > 0) {

            if ( INTERSECTED != intersects[ 0 ].vertex ) {

                INTERSECTED = intersects[ 0 ].vertex;

                var isActive;

                if( $('#selectedTweet').hasClass('active') ) {
                    isActive = true;
                } else {
                    isActive = false;
                }

                var particleData = particleSystem.geometry.vertices[INTERSECTED];

                renderTweetInfo.tweetContent(particleData, isActive);

                //TODO camera looks at particle

//                console.log(particleData)
//
//                console.log(camera.position);
//
//                camera.position.x = particleData.x;
//                camera.position.y = particleData.y;

                camera.updateProjectionMatrix();
                renderer.clear();

            }

        } else {

            renderTweetInfo.tweetContent('', false);

        }

    }

    function onDocumentMouseMove(event) {

        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    }

    function animate() {

        particleSystem.geometry.computeBoundingSphere();
        
    
        _.each(particleSystem.geometry.vertices, function(val, key) {

            if(val.x > -9999 && val.finalCo) {

                if (val.finalCo.x < 0) {
                    if (val.x > val.finalCo.x ) {
                        val.x -= 1;
                    }
                } else {
                    if (val.x < val.finalCo.x ) {
                        val.x += 1;
                    }
                }

                if (val.finalCo.y < 0) {
                    if (val.y > val.finalCo.y ) {
                        val.y -= 1;
                    }
                } else {
                    if (val.y < val.finalCo.y ) {
                        val.y += 1;
                    }
                }

                if (val.finalCo.z < 0) {
                    if (val.z > val.finalCo.z ) {
                        val.z -= 1;
                    }
                } else {
                    if (val.z < val.finalCo.z ) {
                        val.z += 1;
                    }
                }

                if(values_size[key] < 64) {
                    values_size[key] +=0.5;
                }

            }

        })
        
        requestAnimationFrame(animate);
        render();

    }

    function initPostprocessing() {

        postprocessing.scene = new THREE.Scene();

        postprocessing.camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2,  window.innerHeight / 2, window.innerHeight / - 2, -10000, 10000 );
        postprocessing.camera.position.z = 100;

        postprocessing.scene.add( postprocessing.camera );

        var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
        postprocessing.rtTextureDepth = new THREE.WebGLRenderTarget( window.innerWidth, height, pars );
        postprocessing.rtTextureColor = new THREE.WebGLRenderTarget( window.innerWidth, height, pars );

        var bokeh_shader = THREE.BokehShader;

        postprocessing.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );

        postprocessing.bokeh_uniforms[ "tColor" ].value = postprocessing.rtTextureColor;
        postprocessing.bokeh_uniforms[ "tDepth" ].value = postprocessing.rtTextureDepth;
        postprocessing.bokeh_uniforms[ "focus" ].value = 1.1;
        postprocessing.bokeh_uniforms[ "aspect" ].value = window.innerWidth / height;

        postprocessing.materialBokeh = new THREE.ShaderMaterial( {

            uniforms: postprocessing.bokeh_uniforms,
            vertexShader: bokeh_shader.vertexShader,
            fragmentShader: bokeh_shader.fragmentShader

        } );

        postprocessing.quad = new THREE.Mesh( new THREE.PlaneGeometry( window.innerWidth, window.innerHeight ), postprocessing.materialBokeh );
        postprocessing.quad.position.z = - 500;
        postprocessing.scene.add( postprocessing.quad );

    }

    function render() {



//        theta += 0.05;
//
//        camera.position.x = radius * Math.sin(theta * Math.PI / 360);
//        camera.position.y = radius * Math.sin(theta * Math.PI / 360);
//        camera.position.z = radius * Math.cos(theta * Math.PI / 360);

        camera.lookAt(scene.position);
        renderer.clear();

        //

        var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
        projector.unprojectVector(vector, camera);

        var ray = new THREE.Ray(camera.position, vector.subSelf(camera.position).normalize());

        var intersects = ray.intersectObjects(scene.children);

        if (intersects.length > 0) {

            particleSystem.rotation.y += 0.001;
            particleSystem.rotation.x += 0.001;

            $('body').css('cursor','pointer');



        } else {

            particleSystem.rotation.y += 0.005;
            particleSystem.rotation.x += 0.002;

            $('body').css('cursor','inherit');

        }

        //

        renderer.render(scene, camera);

    }

    window.addEventListener('resize', onWindowResize, false);

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );

    init();
    animate();

});


