import { QuartzComponent, QuartzComponentConstructor } from "./types"
import AIAutoList from "./AIAutoList"

const AIHome: QuartzComponent = (props) => {

  if (props.fileData.slug !== "index") {
    return null
  }

  return (
    <div>

      <AIAutoList
        title="🔥 最新AI动态"
        keyword="官方产品更新"
        limit={5}
        {...props}
      />

      <AIAutoList
        title="🔍 最新AI工具发现"
        keyword="AI工具发现"
        limit={5}
        {...props}
      />

    </div>
  )
}

export default (() => AIHome) satisfies QuartzComponentConstructor