import { AllWidgetProps, React, jsx } from 'jimu-core'
import { type IMConfig } from '../config';
import * as d3 from './lib/d3.js'
import { useState } from 'react';
const { useEffect, useRef } = React

export default function Widget (props: AllWidgetProps<IMConfig>) {
  const [chartData, setChartData] = useState<any[]|any>(null);
  
  const mainRef = useRef<HTMLDivElement>()

  useEffect(() => {
    if (mainRef && mainRef.current&&chartData) {
      
      let maxDate = 0; 
      let minDate = 9999999999999999999999999999999;
      let xAxisDataLabels = [];
      let yAxisessDataArray = {};
      props.config.yAxisess.map((yAxis:any)=>{
        yAxisessDataArray[yAxis.fieldName] = {
          values:[],
          chartType:yAxis.chartType,
          name:chartData.fieldAliases[yAxis.fieldName],
          color:yAxis.color
        }
      });

      chartData.features.map((feat:any)=>{
        let x_ = feat.attributes[props.config.xAxis];
        if(!x_){
          debugger;
        }
        let date__ = new Date(feat.attributes[props.config.xAxis]);
        if(date__.getTime()>maxDate){
          maxDate = date__.getTime();
        }
        if(date__.getTime()<minDate){
          minDate = date__.getTime();
        }
        xAxisDataLabels.push(date__);
        props.config.yAxisess.map((yAxis:any)=>{  
          let y_ = feat.attributes[yAxis.fieldName];
          if(!y_){
            y_ = 0;
          }
          yAxisessDataArray[yAxis.fieldName].values.push({x:date__,y:y_});
        });

      });
      let datasets = [];
      let colors = [];


      Object.keys(yAxisessDataArray).map((item_:any)=>{
        datasets.push(yAxisessDataArray[item_]);
        colors.push(yAxisessDataArray[item_].color);
      });
      
      if(datasets.length==0) return;    

      

    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleTime()
    .domain(d3.extent(datasets[1].values, function(d) { return d.x; }))
    .range([marginLeft, width - marginRight]);

      // Declare the y (vertical position) scale.
      const y = d3.scaleLinear()
      .domain([0, d3.max(datasets[1].values, function(d) { return +d.y; })])
          .range([height - marginBottom, marginTop]);

      // Create the SVG container.
      const svg = d3.create("svg")
          .attr("width", width)
          .attr("height", height);

      // Add the x-axis.
      svg.append("g")
          .attr("transform", `translate(0,${height - marginBottom})`)
          .call(d3.axisBottom(x));

      // Add the y-axis.
      svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

        svg.append("path")
      .datum(datasets[1].values)
      .attr("fill", datasets[1].color)
      .attr("stroke", datasets[1].color)
      .attr("stroke-width", 1.5)
      .attr("d", d3.line()
        .x(function(d) { return x(d.x) })
        .y(function(d) { return y(d.y) })
        )

      mainRef.current.appendChild(svg.node())
    }
  }, [mainRef,chartData]);

  useEffect(() => {
    var url = new URL(props.config.layerServiceUrl);
    let yAxisessFields = props.config.yAxisess.map(({ fieldName }) => fieldName);
    //@ts-ignore
    yAxisessFields.push(props.config.xAxis);
    var params = [['where', '1=1'], ['outFields', yAxisessFields.join()],['returnGeometry','false'],['f','pjson']]

    url.search = new URLSearchParams(params).toString();
    
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setChartData(data);
      })
  }, [props.config.layerServiceUrl])

  return (
    <div className="widget-d3 jimu-widget p-2">
      <div ref={mainRef}></div>
    </div>
  )
}
