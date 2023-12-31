import { React, type AllWidgetProps, ServiceManager,Immutable } from 'jimu-core';
import { type IMConfig } from '../config';
import { MultiSelect } from 'jimu-ui';
import { useEffect, useState } from 'react';
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import FeatureLayer from "esri/layers/FeatureLayer";
import MapImageLayer from 'esri/layers/MapImageLayer'


const Widget = (props: AllWidgetProps<IMConfig>) => {

  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView>(null);
  const [layers, setLayers] = useState<any[]|any>([]);
  const [selectedLayers, setSelectedLayers] = useState<any[]|any>([]);
  
  const modulesM = React.useRef<any[]>(null);

  const checkLayer = (checked:boolean,layerIndex)=>{
      if(checked){
        layers[layerIndex].layerGroup.map((layer_:any)=>{
          jimuMapView.view.map.add(layer_);
        });
      }else{
        layers[layerIndex].layerGroup.map((layer_:any)=>{
          jimuMapView.view.map.remove(layer_);
        });
      }
      layers[layerIndex].checked = checked;
      let layers_ = [];
      layers.map((layer_:any)=>{
        layers_.push(layer_);
      })
      setLayers(layers_); 
  };

  useEffect(() => {
    for (let i = 0; i < props.config.layers.length; i++) {
      let layer_ = props.config.layers[i];
      let layerType = 'MapServer';
      
      if(layer_.url.indexOf('/FeatureServer')>-1){
        layerType = 'FeatureServer';
        let layerGroup = [];
        ServiceManager.getInstance().fetchServiceInfo(layer_.url).then((res:any) => {        
          const layers__ = (res.definition?.layers || []).concat(res.definition?.tables || [])
          if (layers__.length > 0){
            layers__.map((layer___:any)=>{
              layerGroup.push(new FeatureLayer({
                url:layer_.url+'/'+layer___.id}));
            })
          }
          layers.filter((layer_____:any)=>{return layer_____.url==layer_.url})[0].layerGroup = layerGroup;
          setLayers(layers);  
        })
        layers.push({
          value:layers.length,
          label:layer_.title,
          url:layer_.url,
          checked:false,
          layerGroup:layerGroup,
          layerType:layerType
        });
        setLayers(layers);
      }
      
      if(layer_.url.indexOf('/MapServer')>-1){
        let layerGroup = [];
        layerGroup.push(
          new MapImageLayer({url:layer_.url}));
          layers.push({
            value:layers.length,
            label:layer_.title,
            url:layer_.url,
            checked:false,
            layerGroup:layerGroup,
            layerType:layerType
          });
          setLayers(layers);
      }
    }
  }, [props.config.layers])

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv);
    }
  };

  const onLayerSelected = (evt, value, values) => {
    layers.map((layerItem_:any)=>{
      layerItem_.layerGroup.map((layer_:any)=>{
        jimuMapView.view.map.remove(layer_);
      });
    });
    layers.filter((layerItem_:any)=>{
      return values.indexOf(layerItem_.value)>-1;
    }).map((layerItem_:any)=>{
      layerItem_.layerGroup.map((layer_:any)=>{
        jimuMapView.view.map.add(layer_);
      });
    });
  }

  return (
    <div className="widget-starter jimu-widget" style={{ background: 'white' }}>
      <React.Fragment>
        {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
        )}
        {jimuMapView?.view && (
          <React.Fragment>
            <div className="widget-demo jimu-widget m-2">
              <p>{props.config.title}</p>
              <MultiSelect
                buttonProps={{
                  title: 'Static title'
                }}
                items={layers}
                onClickItem={onLayerSelected}
                placeholder="Select layers"
              />  
            </div>
          </React.Fragment>
        )}
      </React.Fragment>
    </div >
  );
}

export default Widget
