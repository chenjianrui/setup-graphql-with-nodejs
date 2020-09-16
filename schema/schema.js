const graphql = require('graphql')
const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLSchema } = graphql
const _ = require('lodash')

// hard code
const users = [
  { id: '23', firstName: 'Nick', age: 18},
  { id: '48', firstName: 'Tony', age: 22 }
]

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    // 定義型態
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt }
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
      resolve(parentValue, args) {
        return _.find(users, { id: args.id })
      }
    }
  }
})

module.exports = new GraphQLSchema({ query: RootQuery })