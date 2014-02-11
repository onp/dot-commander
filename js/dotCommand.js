$(function(){
    FastClick.attach(document.body)

    var dotData = []

    var mouseMode = "create"
    
    var rejectKey = []
    
    var translate = [0,0]
    var scaleFactor = 1
    var zpOrigin
    
    
    var createMode = false;
    
    var widthC
    var heightC
    var widthF = 900;
    var heightF = 900;

    var zoom  = function () {
        fieldContainer.attr("transform", "translate(" + translate + ")scale(" + scaleFactor + ")");
        console.log(translate)
    }
    
    function refreshDots(){
        var dotVis = d3.select("svg#fieldContainer g g")
                    .selectAll("circle.dot")
                    .data(dotData)
        dotVis.exit().remove()
        dotVis.enter().append("circle")
            .attr("r", 5)
            .attr("class","dot")
            .attr("cx",function(d){return d.x})
            .attr("cy",function(d){return d.y})
            .attr("fill","blue")
    }

    function createDot(position){
        console.log(position)
        if (mouseMode !== "create"){
            return
        }
        dotData.push({"x":position[0],"y":position[1]})
        refreshDots()
    }

    function resize(){
        widthC = $("body").innerWidth()
        heightC = $("body").innerHeight()
        d3.select("svg#fieldContainer")
            .attr("width",widthC)
            .attr("height",heightC)
        scaleFactor = d3.min([widthC/widthF, heightC/heightF])
        zoom()
    }

    function keydownHandler(){
        var keyCode = d3.event.keyCode
        if (rejectKey[keyCode]){return}
        if (keyCode === 67){            //c
            mouseMode = "create";
        } else if (keyCode === 90){     //z
            mouseMode = "zoom";
        }
    }

    function keyupHandler(){
        rejectKey[d3.event.keyCode] = false;
    }

    var playingfield = null

    fieldContainer = d3.select("svg#fieldContainer")
        .append("g")
            .on("click",function(){
                createDot(d3.mouse(playingfield[0][0]))
            })
        .append("g")
        
    playingfield = fieldContainer.append("rect")
        .attr("class", "overlay")
        .attr("width",widthF)
        .attr("height",heightF)
                
        
    resize()
    $(window).resize(resize)

    d3.select(window)
        .on('keydown',keydownHandler)
        .on('keyup',keyupHandler)
        
    var processTouchPair = function(newTouches){
        var transData = {}
        transData.touches = newTouches;
        var xAvg = (newTouches[0].clientX+newTouches[1].clientX)/2
        var yAvg = (newTouches[0].clientY+newTouches[1].clientY)/2
        var dx = newTouches[0].clientX - newTouches[1].clientX
        var dy = newTouches[0].clientY - newTouches[1].clientY
        transData.center = [xAvg,yAvg]
        transData.dist = Math.sqrt(dx*dx + dy*dy)
        return transData
    }
        
    var setTransformBase = function(newTouchEvent){
        var transBase = processTouchPair(newTouchEvent.touches)
        transBase.translateOffset = [translate[0]-transBase.center[0],translate[1]-transBase.center[1]]
        transBase.scaleCoeff = scaleFactor/transBase.dist
        zpOrigin = transBase;
    }
    
    
    playingfield.on('touchstart',function(){
        console.log(d3.event)
        if (d3.event.touches.length ===2){
            setTransformBase(d3.event)
        }
    })
    
    playingfield.on('touchend',function(){
        console.log(d3.event)
        if (d3.event.touches.length ===2){
            setTransformBase()
        }
    })
        
    playingfield.on('touchmove',function(){
        d3.event.preventDefault()
        if (d3.event.touches.length ===2){
            var newTouches = processTouchPair(d3.event.touches)
            translate[0] = zpOrigin.translateOffset[0] + newTouches.center[0];
            translate[1] = zpOrigin.translateOffset[1] + newTouches.center[1];
            scaleFactor = zpOrigin.scaleCoeff*newTouches.dist;
            zoom()
        }
    })
        

    

        

})

