$(function () {
    "use strict";
    //FastClick.attach(document.body);

    var dotData = [];

    var mouseMode = "create";

    var rejectKey = [];

    var translateVec = [0, 0];
    var scaleFactor = 1;
    var rotateDeg = 0;
    var rotateRad = 0;
    var tm = mat3.create()  //transformMatrix for the playing field
    var tmi = mat3.create()  //transformMatrix inverse
    var tmo = mat3.create()
    console.log(tm)
    
    var zpOrigin = {};

    var activeTouches = [];


    var createMode = false;

    var widthC;
    var heightC;
    var widthF = 400;
    var heightF = 400;

    var updateTransform  = function () {
        //mat3.copy(tm,tmo)
        mat3.identity(tm)
        mat3.translate(tm,tm,translateVec)
        mat3.scale(tm,tm,[scaleFactor,scaleFactor])
        if (zpOrigin.fieldCenter !== undefined){
            //mat3.translate(tm,tm,zpOrigin.fieldCenter)
            mat3.rotate(tm,tm,-rotateRad)
            //mat3.translate(tm,tm,vec2.negate([],zpOrigin.fieldCenter))
        } else {
            mat3.rotate(tm,tm,-rotateRad)
        }
        mat3.invert(tmi,tm)
        
        var svgMatrix = [
            tm[0],tm[1],tm[3],tm[4],
            tm[6],tm[7]
            ]
    
        fieldContainer.attr("transform","matrix("+svgMatrix+")");
        console.log(translateVec, scaleFactor, rotateRad);
    };

    var refreshDots = function () {
        var dotVis = d3.select("svg#fieldContainer g g")
                    .selectAll("circle.dot")
                    .data(dotData);
        dotVis.exit().remove();
        dotVis.enter().append("circle")
            .attr("r", 5)
            .attr("class", "dot")
            .attr("cx", function (d) {return d.x; })
            .attr("cy", function (d) {return d.y; })
            .attr("fill", "blue");
    };

    var createDot = function (position) {
        console.log(position);
        if (mouseMode !== "create") {
            return;
        }
        dotData.push({"x": position[0], "y": position[1]});
        refreshDots();
    };

    var resize = function () {
        widthC = $("body").innerWidth();
        heightC = $("body").innerHeight();
        d3.select("svg#fieldContainer")
            .attr("width", widthC)
            .attr("height", heightC);
        scaleFactor = d3.min([widthC / widthF, heightC / heightF]);
        updateTransform();
    };

    var keydownHandler = function () {
        var keyCode = d3.event.keyCode;
        if (rejectKey[keyCode]) {return; }
        if (keyCode === 67) {            //c
            mouseMode = "create";
        } else if (keyCode === 90) {     //z
            mouseMode = "zoom";
        }
    };

    var keyupHandler = function () {
        rejectKey[d3.event.keyCode] = false;
    };

    var playingfield = null;

    var fieldContainer = d3.select("svg#fieldContainer")
        .append("g")
        .on("click", function () {
            var dotCoords = [d3.event.clientX,d3.event.clientY];
            vec2.transformMat3(dotCoords,dotCoords,tmi);
            createDot(dotCoords);
        })
        .append("g");

    playingfield = fieldContainer.append("rect")
        .attr("class", "overlay")
        .attr("width", widthF)
        .attr("height", heightF);



    resize();
    $(window).resize(resize);

    d3.select(window)
        .on('keydown', keydownHandler)
        .on('keyup', keyupHandler);

    var processTouchPair = function () {
        var evtTouches = d3.event.touches;
        var screenPoints = [[evtTouches[0].pageX,evtTouches[0].pageY],
                            [evtTouches[1].pageX,evtTouches[1].pageY]];
        var fieldPoints = [vec2.transformMat3([],screenPoints[0],tmi),
                           vec2.transformMat3([],screenPoints[1],tmi)];
        var flipped = false;
        
        if (screenPoints[0][1] < screenPoints[1][1]) {
            flipped = true;
        }
        var sxAvg = (screenPoints[0][0] + screenPoints[1][0]) / 2;
        var syAvg = (screenPoints[0][1] + screenPoints[1][1]) / 2;
        var sdx = screenPoints[0][0] - screenPoints[1][0];
        var sdy = screenPoints[0][1] - screenPoints[1][1];
        var fxAvg = (fieldPoints[0][0] + fieldPoints[1][0]) / 2;
        var fyAvg = (fieldPoints[0][1] + fieldPoints[1][1]) / 2;
        var fdx = fieldPoints[0][0] - fieldPoints[1][0];
        var fdy = fieldPoints[0][1] - fieldPoints[1][1];
        var td = {};  //out data
        td.screenXY = screenPoints;
        td.fieldXY = fieldPoints;
        td.screenCenter = [sxAvg, syAvg];
        td.fieldCenter = [fxAvg,fyAvg];
        td.screenDist = Math.sqrt(sdx * sdx + sdy * sdy);
        td.fieldDist = Math.sqrt(fdx * fdx + fdy * fdy);
        td.rad = Math.atan(sdx / sdy) + Math.PI * flipped;

        // $("#overlay-interface").html( 
            // "t1:" + screenPoints[0][0] + ',' + screenPoints[0][1] + 
            // "  t2:" + screenPoints[1][0] + ',' + screenPoints[1][1] + 
            // '  ' + flipped + "  "+Math.round(td.rad*180/Math.PI)+
            // "<br>" + translateVec + '   ' + Math.round(scaleFactor) + '   ' +Math.round(rotateRad*180/Math.PI)+
            // "<br>" +Math.round(zpOrigin.rotateOffset*180/Math.PI)
        // );
        return td;
    };

    var setTransformBase = function () {
        //must be called by a touch event
        mat3.copy(tmo,tm)
        var transBase = processTouchPair();
        // $("#overlay-interface").html( 
            // Math.round(translateVec[0]) + '   ' + Math.round(translateVec[1]) +
            // '<br>' + Math.round(transBase.screenCenter[0]) + '   ' + Math.round(transBase.screenCenter[1])
        // )
        transBase.transVecO = translateVec.slice()
        transBase.translateOffset = [translateVec[0] - transBase.screenCenter[0], translateVec[1] - transBase.screenCenter[1]];
        transBase.scaleCoeff = scaleFactor / transBase.screenDist;
        transBase.rotateOffset = rotateRad - transBase.rad;
        zpOrigin = transBase;
        
        

        var tsmDat = transBase.fieldXY.slice();
        tsmDat.push([transBase.fieldCenter[0], transBase.fieldCenter[1]]);
        var touchStartMarkers = d3.select("svg#fieldContainer g g")
                          .selectAll("circle.tsm")
                          .data(tsmDat);
        touchStartMarkers.exit().remove();
        touchStartMarkers.enter().append("circle")
            .attr("r", 20)
            .attr("class", "tsm")
            .attr("fill", "orange");
        touchStartMarkers
            .attr("cx", function (d) {return d[0]; })
            .attr("cy", function (d) {return d[1]; });
        
        var tsmfDat = transBase.screenXY.slice()
        tsmfDat.push(translateVec)
        tsmfDat.push(transBase.screenCenter)
        var touchStartMarkersF = d3.select("svg#fieldContainer")
                          .selectAll("circle.tsmf")
                          .data(tsmfDat);
        touchStartMarkersF.exit().remove();
        touchStartMarkersF.enter().append("circle")
            .attr("r", 16)
            .attr("class", "tsmf")
            .attr("fill", "blue");
        touchStartMarkersF
            .attr("cx", function (d) {return d[0]; })
            .attr("cy", function (d) {return d[1]; });
    };


    playingfield.on('touchstart', function () {
        if (d3.event.touches.length === 2) {
            setTransformBase();
        }
    });

    playingfield.on('touchend', function () {
        if (d3.event.touches.length === 2) {
            setTransformBase();
        } else {
            d3.select("svg#fieldContainer")
                          .selectAll("circle.touchMark")
                          .data([])
                          .exit().remove();
            d3.select("svg#fieldContainer")
                          .selectAll("circle.tsm")
                          .data([])
                          .exit().remove();
            d3.select("svg#fieldContainer")
                          .selectAll("circle.tsmf")
                          .data([])
                          .exit().remove();
        }
    });

    playingfield.on('touchmove', function () {
        d3.event.preventDefault();
        if (d3.event.touches.length === 2) {
            var newTouches = processTouchPair();
            rotateRad = zpOrigin.rotateOffset + newTouches.rad;
            scaleFactor = zpOrigin.scaleCoeff * newTouches.screenDist;
            var rtr = mat3.create()
            mat3.translate(rtr,rtr,zpOrigin.fieldCenter)
            mat3.rotate(rtr,rtr,rotateRad)
            mat3.translate(rtr,rtr,vec2.negate([],zpOrigin.fieldCenter))
            mat3.invert(rtr,rtr)
            translateVec[0] = zpOrigin.translateOffset[0] * (newTouches.screenDist / zpOrigin.screenDist) 
                    + newTouches.screenCenter[0]
                    + rtr[6]*scaleFactor;
            translateVec[1] = zpOrigin.translateOffset[1] * (newTouches.screenDist / zpOrigin.screenDist) 
                    + newTouches.screenCenter[1]
                    + rtr[7]*scaleFactor;

            
            $("#overlay-interface").html( 
                //(zpOrigin.fieldCenter[0]*(1-Math.cos(rotateRad)) + zpOrigin.fieldCenter[1]*Math.sin(rotateRad))
                (rtr[6])
                + ' <br> '
                //+ (zpOrigin.fieldCenter[1]*(1-Math.cos(rotateRad)) - zpOrigin.fieldCenter[0]*Math.sin(rotateRad))
                +(rtr[7])
            )
            updateTransform();
            
            //translateVec[0] = (newTouches.screenCenter[0] - zpOrigin.screenCenter[0]) +(1-scaleFactor)*zpOrigin.fieldCenter[0];
            //translateVec[1] = (newTouches.screenCenter[1] - zpOrigin.screenCenter[1]) +(1-scaleFactor)*//zpOrigin.fieldCenter[1];
            //scaleFactor = newTouches.screenDist/zpOrigin.screenDist;
            //rotateRad = newTouches.rad - zpOrigin.rad;
            //updateTransform()
            
            

            var touchMarkers = d3.select("svg#fieldContainer g g")
                          .selectAll("circle.touchMark")
                          .data(newTouches.fieldXY);
            touchMarkers.exit().remove();
            touchMarkers.enter().append("circle")
                .attr("r", 18)
                .attr("class", "touchMark")
                .attr("fill", "red");
            touchMarkers.attr("cx", function (d) {return d[0]; })
                .attr("cy", function (d) {return d[1]; });
                
        var trmDat = [newTouches.screenCenter]
        trmDat.push([newTouches.screenCenter[0]+zpOrigin.translateOffset[0] * (newTouches.screenDist / zpOrigin.screenDist),newTouches.screenCenter[1]+zpOrigin.translateOffset[1] * (newTouches.screenDist / zpOrigin.screenDist)])
        trmDat.push([trmDat[1][0]+rtr[6]*scaleFactor,trmDat[1][1]+rtr[7]*scaleFactor])
        //trmDat.push(zpOrigin.screenCenter)
        var transMarkers = d3.select("svg#fieldContainer")
                          .selectAll("circle.trm")
                          .data(trmDat);
        transMarkers.exit().remove();
        transMarkers.enter().append("circle")
            .attr("r", 20)
            .attr("class", "trm")
            .attr("fill", "blueviolet");
        transMarkers
            .attr("cx", function (d) {return d[0]; })
            .attr("cy", function (d) {return d[1]; });
        }
    });

});

