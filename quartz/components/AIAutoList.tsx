import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative } from "../util/path"

interface Options {
  title: string
  keyword: string
  limit?: number
}

const AIAutoList = (opts: Options): QuartzComponent => {

  return ({
    allFiles,
    fileData,
  }: QuartzComponentProps) => {


    const pages = allFiles
      .filter((page) => {

        const path = page.filePath ?? ""

        return path.includes(opts.keyword)

      })
      .sort((a,b)=>{

        const dateA =
          a.dates?.modified?.getTime() ?? 0

        const dateB =
          b.dates?.modified?.getTime() ?? 0

        return dateB-dateA

      })
      .slice(0, opts.limit ?? 5)



    return (

      <section>

        <h2>{opts.title}</h2>


        {
          pages.length === 0 && (
            <p>
              暂无最新内容
            </p>
          )
        }


        <ul>

        {
          pages.map((page)=>(
            
            <li>

              <a
                href={
                  resolveRelative(
                    fileData.slug!,
                    page.slug!
                  )
                }
                class="internal"
              >

                {
                  page.frontmatter?.title
                  ??
                  page.slug
                }

              </a>

            </li>

          ))
        }

        </ul>


      </section>

    )
  }

}


export default AIAutoList as QuartzComponentConstructor