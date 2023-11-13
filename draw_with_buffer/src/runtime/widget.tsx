import { React, type AllWidgetProps, jsx, css, type ImmutableArray, lodash, loadArcGISJSAPIModule, utils, hooks } from 'jimu-core'
import { UnitType, type IMConfig } from '../config'
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import { InteractiveDraw } from './interactive-draw-tool'
import { QueryTaskContext } from './query-task-context'
import { BufferInput } from './buffer-input'
import { SearchOutlined } from 'jimu-icons/outlined/editor/search'
import { TrashOutlined } from 'jimu-icons/outlined/editor/trash'
import { VisibleOutlined } from 'jimu-icons/outlined/application/visible'
import { InvisibleOutlined } from 'jimu-icons/outlined/application/invisible'
import { TextInput, Button } from 'jimu-ui'
import './main.css';

const Widget = (props: AllWidgetProps<IMConfig>) => {
  /** ADD: **/
  const { useState } = React
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView>(null);
  const queryTaskContext = React.useContext(QueryTaskContext)
  const resetSymbolRef = React.useRef(queryTaskContext.resetSymbol)
  const getLayerFunRef = React.useRef<() => __esri.GraphicsLayer>(null)
  const geometryEngineRef = React.useRef<__esri.geometryEngine>(null)
  const geometryServiceRef = React.useRef<{ geometryService: __esri.geometryService, bufferParameters: __esri.BufferParametersConstructor }>(null)
  const geometryRef = React.useRef<__esri.Geometry>(null)
  const bufferDistanceRef = React.useRef(0)
  const bufferUnitRef = React.useRef('Meters')
  const bufferedGraphicRef = React.useRef<__esri.Graphic>(null)
  //const [bufferedGraphicRef, setBufferedGraphicRef] = React.useRef<__esri.Graphic>(null);
  const graphicsArr = React.useRef([]);
  const [graphicsArrState, setGraphicsArrState] = React.useState<any[]>([]);
  const modulesM = React.useRef<any[]>(null);
  const localStorageGraphicsItemKey = 'graphicItemsToLocal';
  hooks.useEffectOnce(() => {
    loadArcGISJSAPIModules([
      'esri/Graphic'
    ]).then((modules) => {
      modulesM.current = modules;
      /*bufferedGraphicRef.current = new Graphic({
        symbol: {
          type: 'simple-fill',
          color: [51, 51, 204, 0.5],
          style: 'solid',
          outline: {
            color: [51, 51, 204, 0.8],
            width: 1
          }
        }
      })*/
    })
  })

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv);
    }
  };

  const applyBufferEffect = React.useCallback(async () => {
    let bufferedGraphicRef_ = new modulesM.current[0]({
      symbol: {
        type: 'simple-fill',
        color: [51, 51, 204, 0.5],
        style: 'solid',
        outline: {
          color: [51, 51, 204, 0.8],
          width: 1
        }
      }
    });
    if (!geometryRef.current || bufferDistanceRef.current === 0) {
      bufferedGraphicRef_.geometry = null;
      bufferedGraphicRef.current = bufferedGraphicRef_;
      //setBufferedGraphicRef(bufferedGraphicRef_);
      return
    }
    const geometry = geometryRef.current
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-geometry-geometryEngine.html#buffer
    if (geometry.spatialReference?.isGeographic && !geometry.spatialReference.isWGS84) {
      const serviceUrl = utils.getGeometryService()
      if (!geometryServiceRef.current) {
        const modules = await loadArcGISJSAPIModules([
          'esri/rest/geometryService',
          'esri/rest/support/BufferParameters'
        ])
        geometryServiceRef.current = {
          geometryService: modules[0],
          bufferParameters: modules[1]
        }
      }
      const { geometryService, bufferParameters: BufferParameters } = geometryServiceRef.current
      const polygons = await geometryService.buffer(serviceUrl, new BufferParameters({
        distances: [bufferDistanceRef.current],
        unit: lodash.kebabCase(bufferUnitRef.current) as any,
        geodesic: true,
        bufferSpatialReference: geometry.spatialReference,
        outSpatialReference: geometry.spatialReference,
        geometries: [geometry]
      }))
      bufferedGraphicRef_.current.geometry = polygons[0]
    } else {
      if (!geometryEngineRef.current) {
        geometryEngineRef.current = await loadArcGISJSAPIModule('esri/geometry/geometryEngine')
      }
      if (geometry.spatialReference?.isWGS84 || geometry.spatialReference?.isWebMercator) {
        bufferedGraphicRef_.geometry = geometryEngineRef.current.geodesicBuffer(geometry, bufferDistanceRef.current, lodash.kebabCase(bufferUnitRef.current) as any) as __esri.Polygon
      } else {
        bufferedGraphicRef_.geometry = geometryEngineRef.current.buffer(geometry, bufferDistanceRef.current, lodash.kebabCase(bufferUnitRef.current) as any) as __esri.Polygon
      }
    }
    bufferedGraphicRef_.attributes['name'] = 'new buffered' + bufferedGraphicRef_.geometry.type;
    graphicsArr.current.push(bufferedGraphicRef_);
    graphicsArrState.push(bufferedGraphicRef_)
    setGraphicsArrState(graphicsArrState);
  }, [])

  const saveGraphicsToLocalStorage = (arr: any[]) => {
    localStorage.setItem(localStorageGraphicsItemKey, JSON.stringify([]));
    let data_ = [];
    for (let i = 0; i < arr.length; i++) {
      data_.push(arr[i].toJSON());
    }
    localStorage.setItem(localStorageGraphicsItemKey, JSON.stringify(data_));
  };

  const handleDrawEnd = React.useCallback((graphic, getLayerFun, clearAfterApply) => {
    if (!graphic) return;
    getLayerFunRef.current = getLayerFun
    //    const layer = getLayerFunRef.current && getLayerFunRef.current()
    geometryRef.current = graphic?.geometry
    graphic.attributes['name'] = 'new ' + graphic.geometry.type;
    graphicsArr.current.push(graphic);
    graphicsArrState.push(graphic)
    setGraphicsArrState(graphicsArrState);
    applyBufferEffect().then(() => {
      getLayerFunRef.current && (getLayerFunRef.current)().removeAll()
      getLayerFunRef.current().addMany(graphicsArr.current);
      saveGraphicsToLocalStorage(graphicsArr.current);
    })
    //onGeometryChange(graphic?.geometry, layer, graphic, clearAfterApply)
  }, [])

  const handleBufferChange = React.useCallback((distance, unit) => {

    bufferDistanceRef.current = distance
    bufferUnitRef.current = unit
    /*
    applyBufferEffect()
    //onBufferChange(distance, unit)*
    */
  }, [applyBufferEffect])

  return (
    <div className="widget-starter jimu-widget" style={{ background: 'white' }}>
      <React.Fragment>
        {props.useMapWidgetIds && props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent useMapWidgetId={props.useMapWidgetIds?.[0]} onActiveViewChange={activeViewChangeHandler} />
        )}
        {jimuMapView?.view && (
          <React.Fragment>
            <InteractiveDraw
              jimuMapView={jimuMapView}
              onDrawEnd={handleDrawEnd}
              onCleared={() => {
                graphicsArr.current = [];
                localStorage.setItem(localStorageGraphicsItemKey, JSON.stringify([]));
                setGraphicsArrState([]);
              }}
              onCreated={(getLayerFun) => {
                getLayerFunRef.current = getLayerFun;
                let localData = JSON.parse(localStorage.getItem(localStorageGraphicsItemKey));
                if (localData && localData.length > 0) {
                  let localData_ = [];
                  localData.forEach((item__) => {
                    localData_.push(modulesM.current[0].fromJSON(item__));
                  })
                  graphicsArr.current = localData_;
                  setGraphicsArrState(localData_);
                  getLayerFun().addMany(localData_);
                }
              }}
            />
            <div role='group' aria-label={'bufferDistance'} css={css`margin-top: 0.75rem;`}>
              <div className='text-truncate'>{'buffer distance'}</div>
              <div className='mt-1'>
                <BufferInput distance={0} unit={UnitType.Meters} onBufferChange={handleBufferChange} />
                {(graphicsArrState && graphicsArrState.length > 0) && (
                  <table css={css`width: 100%;`} className='fixed_header'>
                    <thead>
                      <tr>
                        <td>#</td>
                        <td>Name</td>
                        <td>Type</td>
                        <td>Action</td>
                      </tr>
                    </thead>
                    <tbody>
                      {graphicsArrState.map(function (graphicsItem, i) {
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>
                              <TextInput
                                type="text"
                                value={graphicsItem.attributes['name']}
                                onChange={(evt: any) => {
                                  graphicsItem.attributes['name'] = evt.currentTarget.value;
                                  graphicsArrState[i] = graphicsItem;
                                  setGraphicsArrState(graphicsArrState);
                                  graphicsArr.current = graphicsArrState;
                                  saveGraphicsToLocalStorage(graphicsArrState)

                                }}
                                style={{ display: 'flex', flex: 1 }}
                              />

                            </td>
                            <td>{graphicsItem.geometry.type.toUpperCase()}</td>
                            <td css={css`display: flex;`}>
                              <Button icon type='tertiary' size='sm' title={'zoom'} onClick={() => {
                                jimuMapView.view.goTo({
                                  target: [graphicsItem.geometry], zoom: 10
                                })
                              }}>
                                <SearchOutlined />
                              </Button>
                              <Button icon type='tertiary' size='sm' title={'delete'} onClick={() => {
                                if (confirm("Delete object #" + (i + 1) + " ?") == true) {
                                  graphicsArr.current.splice(i, 1);
                                  setGraphicsArrState(graphicsArrState.splice(i, 1));
                                  getLayerFunRef.current && (getLayerFunRef.current)().removeAll()
                                  getLayerFunRef.current().addMany(graphicsArr.current);
                                  saveGraphicsToLocalStorage(graphicsArr.current)
                                }
                              }}>
                                <TrashOutlined />
                              </Button>
                              <Button icon type='tertiary' size='sm' title={'visible'} onClick={() => {
                                graphicsArrState[i].visible = !graphicsArrState[i].visible;
                                setGraphicsArrState(graphicsArrState);
                              }}>
                                {graphicsItem.visible && <VisibleOutlined />}
                                {!graphicsItem.visible && <InvisibleOutlined />}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>)}
                {(graphicsArrState.length == 0) && (
                  <div> Draw objects on map</div>
                )}
              </div>
            </div>
          </React.Fragment>
        )}
      </React.Fragment>

    </div >
  );
}

export default Widget


