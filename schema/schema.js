const graphql = require('graphql')
const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLSchema } = graphql
const axios = require('axios')

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString }
  }
})

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    // 定義型態
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    // 關聯
    company: {
      type: CompanyType,
      // parseValue = { id: '23', firstName: 'Nick', age: 18, companyId: '1' }
      async resolve(parseValue, args){
        const { data } = await axios(`http://localhost:3000/companies/${parseValue.companyId}`)
        return data
      }
    }
  }
})

// RootQuery 目的是允許 GraphQL 跳到特定的節點上
// 目前這個假設一進到網頁後想找特定用戶，前端會以 user 來搜尋
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      // 帶入 arguments，這裡是帶入 id，將會 response 上面 type 的 value
      args: {id: { type: GraphQLString }},
      // 這個 resolve 會進入到 DB 找出你想要的東西
      // args 將帶入想查詢的關鍵字
      async resolve(parentValue, args) {
        const { data } = await axios(`http://localhost:3000/users/${args.id}`)
        return data
      }
    },
    company: {
      type: CompanyType,
      // 查詢時可以帶 id 來找特定的資料
      // For example: company(id: "2")
      args: { id: { type: GraphQLString } },
      async resolve(parseValue, args){
        const { data } = await axios(`http://localhost:3000/companies/${args.id}`)
        return data
      }
    }
  }
})

module.exports = new GraphQLSchema({ query: RootQuery })