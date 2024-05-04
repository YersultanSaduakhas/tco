import { React, type AllWidgetProps } from 'jimu-core'
import { type IMConfig } from '../config'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { Select, Option } from 'jimu-ui'


const Widget = (props: AllWidgetProps<IMConfig>) => {
  const [jimuMapView, setJimuMapView] = React.useState<JimuMapView>(null)
  const [selectedScale, setSelectedScale] = React.useState<number>(null)
  //Osi jerde massivke kerek scale-derdi qoya alasiz
  const [scales, setScales] = React.useState<number[]>([5000000, 2400000, 700000])
  const activeViewChangeHandler = (jmv: JimuMapView) => {
    if (jmv) {
      setSelectedScale(jmv.view.scale)
      //let scales_ = props.config.scales
      //if (!scales_.includes(jmv.view.scale)) {
      //  scales_.unshift(jmv.view.scale)
      //}
      if (!scales.includes(jmv.view.scale)) {
        scales.unshift(jmv.view.scale)
        setScales(scales)
      }
      setJimuMapView(jmv)
    }
  }


  const handleTemplateChange = (e) => {
    const scale = e?.target?.value
    jimuMapView.view.scale = scale
    setSelectedScale(scale)
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
            <Select
            value={selectedScale}
            onChange={handleTemplateChange}
            size='sm'
            className='scalebar-unit'
            // aria-label={nls('template')}
          >
            {scales?.map((scale, index) => {
              return (<Option
                key={scale}
                value={scale}
                title={scale}
              >
                1: {scale}
              </Option>)
            })}
          </Select>
            </div>
          </React.Fragment>
        )}
      </React.Fragment>
    </div >
  )
}

export default Widget
