/** @jsx jsx */
import { React, jsx, type ImmutableArray, moduleLoader, hooks } from 'jimu-core'
import { Checkbox } from 'jimu-ui'
import { type JimuMapView } from 'jimu-arcgis'
import { type JimuDrawCreatedDescriptor, JimuDrawCreationMode } from 'jimu-ui/advanced/map'

import { EntityStatusType, StatusIndicator } from '../common/common-components'
export interface InteractiveDrawProps {
    jimuMapView: JimuMapView
    onDrawEnd: (graphic: __esri.Graphic, getLayerFun?, clearAfterApply?: boolean) => void
}

enum CreateToolType {
    Point = 'Point',
    Polyline = 'Polyline',
    Polygon = 'Polygon',
    Rectangle = 'Rectangle',
    Circle = 'Circle'
}

const sketchToolInfoMap = {
    [CreateToolType.Point]: { drawToolName: 'point', esriClassName: 'esri-icon-point', toolIndex: 0 },
    [CreateToolType.Polyline]: { drawToolName: 'polyline', esriClassName: 'esri-icon-polyline', toolIndex: 4 },
    [CreateToolType.Polygon]: { drawToolName: 'polygon', esriClassName: 'esri-icon-polygon', toolIndex: 2 },
    [CreateToolType.Rectangle]: {
        drawToolName: 'rectangle',
        esriClassName: 'esri-icon-checkbox-unchecked',
        toolIndex: 1
    },
    [CreateToolType.Circle]: { drawToolName: 'circle', esriClassName: 'esri-icon-radio-unchecked', toolIndex: 3 }
}

export function InteractiveDraw(props: InteractiveDrawProps) {
    const { jimuMapView, onDrawEnd } = props
    const [mapModule, setMapModule] = React.useState(null)
    const getLayerFunRef = React.useRef<() => __esri.GraphicsLayer>(null)
    const graphicRef = React.useRef(null)
    const [clearAfterApply, setClearAfterApply] = React.useState(false)

    const visibleElements = React.useMemo(() => {
        return {
            createTools: sketchToolInfoMap,
            selectionTools: {
                'lasso-selection': false,
                'rectangle-selection': false
            },
            settingsMenu: false,
            undoRedoMenu: false
        }
    }, [])

    hooks.useEffectOnce(() => {
        moduleLoader.loadModule('jimu-ui/advanced/map').then((result) => {
            setMapModule(result)
        })
    })

    const handleDrawToolCreated = React.useCallback((jimuDrawToolsRef: JimuDrawCreatedDescriptor) => {
        getLayerFunRef.current = jimuDrawToolsRef.getGraphicsLayer
    }, [])

    const handleDrawStart = React.useCallback(() => {
        getLayerFunRef.current && (getLayerFunRef.current)().removeAll()
    }, [])

    const handleDrawEnd = React.useCallback(
        (graphic) => {
            graphicRef.current = graphic
            onDrawEnd(graphic, getLayerFunRef.current, clearAfterApply)
        },
        [onDrawEnd, clearAfterApply]
    )

    const handleCleared = React.useCallback(() => {
        graphicRef.current = null
        onDrawEnd(null)
    }, [onDrawEnd])

    const handleClearSettingChange = React.useCallback((e) => {
        if (graphicRef.current) {
            onDrawEnd(graphicRef.current, getLayerFunRef.current, e.target.checked)
        }
        setClearAfterApply(e.target.checked)
    }, [onDrawEnd])

    const JimuDraw = mapModule?.JimuDraw
    if (!JimuDraw) {
        return <div>Loading!!</div>;
    }
    const isAvailbel = Object.keys(visibleElements.createTools).some(toolName => visibleElements.createTools[toolName])
    if (!isAvailbel) {
        return null
    }
    return (
        <div>
            <JimuDraw
                jimuMapView={jimuMapView}
                disableSymbolSelector
                drawingOptions={{
                    creationMode: JimuDrawCreationMode.Single,
                    updateOnGraphicClick: false,
                    visibleElements: visibleElements
                }}
                uiOptions={{
                    isHideBorder: true
                }}
                onJimuDrawCreated={handleDrawToolCreated}
                onDrawingStarted={handleDrawStart}
                onDrawingFinished={handleDrawEnd}
                onDrawingCleared={handleCleared}
            />
            {/* <label className='d-flex align-items-center'>
                <Checkbox checked={clearAfterApply} onChange={handleClearSettingChange} className='mr-2' />
                {'clearDrawing'}
            </label> */}
        </div>
    )
}
