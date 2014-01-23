$(function(){
    var dotData = []

    var mouseMode = {
        "create":false,
        "zoom":false
    }
    
    
    var createMode = false;
    
    var widthC
    var heightC
    var widthF = 900;
    var heightF = 900;

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
        if (!mouseMode.create){
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
        zoomer.scaleExtent([scaleFactor, scaleFactor*8])
    }

    function keydownHandler(){
        var keyCode = d3.event.keyCode
        if (keyCode === 67){            //c
            mouseMode.create = true;
        } else if (keyCode === 90){     //z
            mouseMode.zoom = true;
        }
    }

    function keyupHandler(){
        var keyCode = d3.event.keyCode
        if (keyCode === 67){            //c
            mouseMode.create = false;
        } else if (keyCode === 90){     //z
            mouseMode.zoom = false;
            console.log("saving")
            console.log("saving",String(zoomer.scale()),String(zoomer.translate()))
            zoomViewScale = Number(zoomer.scale())
            zoomViewTransX = Number(zoomer.translate()[0])
            zoomViewTransY = Number(zoomer.translate()[1])
            console.log("saved",String(zoomViewScale),String(zoomViewTransX))
        }
    }
    
    var zoomer = d3.behavior.zoom().on("zoom", zoom)

    var playingfield = null

    fieldContainer = d3.select("svg#fieldContainer")
        .append("g")
            .on("click",function(){
                createDot(d3.mouse(playingfield[0][0]))
            })
            .call(zoomer)
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
        
    function zoom() {
        console.log("trueVal",String(zoomer.scale()),String(zoomer.translate()))
        console.log("savedVal",String(zoomViewScale),String(zoomViewTransX))
        if (!mouseMode.zoom){
            return
        }
        if (zoomViewScale !== null){
            console.log("restoring")
            console.log("before",String(zoomer.scale()),String(zoomer.translate()))
            console.log("change to b",String(zoomViewScale),String(zoomViewTransX))
            zoomer.scale(Number(zoomViewScale))
            zoomer.translate([Number(zoomViewTransX),Number(zoomViewTransY)])
            console.log("change to a",String(zoomViewScale),String(zoomViewTransX))
            console.log("after", String(zoomer.scale()),String(zoomer.translate()))
            zoomViewScale = null
            zoomViewTransX = null
            zoomViewTransY = null
        }
        fieldContainer.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }
    

        

})

