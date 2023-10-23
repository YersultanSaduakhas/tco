import { React, type AllWidgetProps, jsx, css, type ImmutableArray, lodash, loadArcGISJSAPIModule, utils, hooks } from 'jimu-core'
import { UnitType, type IMConfig } from '../config'
import { JimuMapViewComponent, type JimuMapView, loadArcGISJSAPIModules } from 'jimu-arcgis'
import { InteractiveDraw } from './interactive-draw-tool'
import { QueryTaskContext } from './query-task-context'
import { BufferInput } from './buffer-input'

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


  hooks.useEffectOnce(() => {
    loadArcGISJSAPIModules([
      'esri/Graphic'
    ]).then((modules) => {
      const Graphic = modules[0]
      bufferedGraphicRef.current = new Graphic({
        symbol: {
          type: 'simple-fill',
          color: [51, 51, 204, 0.5],
          style: 'solid',
          outline: {
            color: [51, 51, 204, 0.8],
            width: 1
          }
        }
      })
    })
  })

  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setJimuMapView(jmv);
    }
  };

  const applyBufferEffect = React.useCallback(async () => {
    if (!geometryRef.current || bufferDistanceRef.current === 0) {
      bufferedGraphicRef.current.geometry = null
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
      bufferedGraphicRef.current.geometry = polygons[0]
    } else {
      if (!geometryEngineRef.current) {
        geometryEngineRef.current = await loadArcGISJSAPIModule('esri/geometry/geometryEngine')
      }
      if (geometry.spatialReference?.isWGS84 || geometry.spatialReference?.isWebMercator) {
        bufferedGraphicRef.current.geometry = geometryEngineRef.current.geodesicBuffer(geometry, bufferDistanceRef.current, lodash.kebabCase(bufferUnitRef.current) as any) as __esri.Polygon
      } else {
        bufferedGraphicRef.current.geometry = geometryEngineRef.current.buffer(geometry, bufferDistanceRef.current, lodash.kebabCase(bufferUnitRef.current) as any) as __esri.Polygon
      }
    }
  }, [])

  const handleDrawEnd = React.useCallback((graphic, getLayerFun, clearAfterApply) => {
    getLayerFunRef.current = getLayerFun
    const layer = getLayerFunRef.current && getLayerFunRef.current()
    geometryRef.current = graphic?.geometry
    applyBufferEffect().then(() => {
      if (bufferedGraphicRef.current.geometry) {
        layer?.add(bufferedGraphicRef.current)
      }
    })
    //onGeometryChange(graphic?.geometry, layer, graphic, clearAfterApply)
  }, [])

  const handleBufferChange = React.useCallback((distance, unit) => {
    bufferDistanceRef.current = distance
    bufferUnitRef.current = unit
    applyBufferEffect()
    //onBufferChange(distance, unit)
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
            />
            <div role='group' aria-label={'bufferDistance'} css={css`margin-top: 0.75rem;`}>
              <div className='text-truncate'>{'buffer distance'}</div>
              <div className='d-flex mt-1'>
                <BufferInput distance={0} unit={UnitType.Meters} onBufferChange={handleBufferChange} />
              </div>
            </div>
          </React.Fragment>
        )}
      </React.Fragment>

    </div>
  );
}

export default Widget


