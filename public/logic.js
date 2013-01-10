$(function () {

    var blobCounter = 0;
    var container;
    var camera, scene, projector, renderer;

    var light = new THREE.SpotLight();

    //

    var radius = 600;
    var theta = 0;

    //

    var WIDTH = window.innerWidth;
    var HEIGHT = window.innerHeight;

    //

    var blob = new Blob();

    //

    var height = window.innerHeight - 300;
    var postprocessing = { enabled  : true };

    var particleCount = 10000;

    var sprite = THREE.ImageUtils.loadTexture( "/public/img/spark.png" );

    var geometry = new THREE.Geometry();

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

    var radius = 500;

    for (var p = 0; p < particleCount; p++) {

        var particle = new THREE.Vector3(-9999, 1, 1  );

        values_size[ p ] = 10;
        values_color[ p ] = new THREE.Color( 0xf6004f);

        particle.data = [];

        particle.multiplyScalar( radius );

        geometry.vertices.push(particle);

    }

    var particleSystem = new THREE.ParticleSystem(geometry, shader);

    particleSystem.geometry.__dirtyVertices = true;
    particleSystem.geometry.__dirtyElements = true;
    particleSystem.geometry.verticesNeedUpdate = true;
    particleSystem.sortParticles = true;
    particleSystem.dynamic = true;

    console.log('particleSystem', particleSystem);

    //

    function init() {

        camera = new THREE.PerspectiveCamera( 40, WIDTH / HEIGHT, 1, 10000 );
        camera.position.z = 300;


        scene = new THREE.Scene();

        scene.fog = new THREE.FogExp2( 0x000104, 0.0000675 );

        projector = new THREE.Projector();

        renderer = new THREE.WebGLRenderer();

        renderer.setSize(window.innerWidth, window.innerHeight);

        initPostprocessing();

        $('#container').html(renderer.domElement);

        light.position.set( 170, 330, -160 );

        scene.add(light);

        var socket = io.connect('http://localhost:3000');

        scene.add(particleSystem);

        socket.on('tweets', function (data) {

            blob.create(data);
            console.log(data);

        });

    }

    function Blob(item) {

        this.create = function (item) {

            var blobSize = item.followers;
            var blobColor = getImportanceColor(item.followers);

            console.log(blobColor);


            if (blobCounter < geometry.vertices.length) {

                var pX = Math.random() * 500 - 250,
                    pY = Math.random() * 500 - 250,
                    pZ = Math.random() * 500 - 250

                var particle = geometry.vertices[blobCounter];
                blobCounter++;

                particle.x = pX;
                particle.y = pY;
                particle.z = pZ;

                particle.data = item;

                values_size[blobCounter] = 64   ;

                values_color[blobCounter].setHSV(blobColor+ 0.4, blobColor+ 0.4, 0.8);

                particleSystem.geometry.__dirtyVertices = true;

            }

        }

        this.destroy = function () {

            scene.remove(item);

        }

    }

    function matchRange(number) {
        var count = 10 * Math.log(number);

        return count;
    }

    function getImportanceColor(number) {
        rgb = (Math.log(number) / 10);
        return rgb;
    }

    function animate() {

        particleSystem.rotation.y += 0.005;
        particleSystem.rotation.x += 0.002;

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

        theta += 0.05;

        camera.position.x = radius * Math.sin(theta * Math.PI / 360);
        camera.position.y = radius * Math.sin(theta * Math.PI / 360);
        camera.position.z = radius * Math.cos(theta * Math.PI / 360);

        camera.lookAt(scene.position);

        renderer.clear();
        renderer.render(scene, camera);



    }

    init();
    animate();

});


