const graphql = require('graphql')
const { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLSchema, GraphQLList, GraphQLNonNull } = graphql
const axios = require('axios')

const CompanyType = new GraphQLObjectType({
  name: 'Company',
  // 因為 hoisting 的關係會無法使用 users 裡的 UserType
  // 所以將原本是 Object 的 fields 換成 Method，然後 return object
  // 表示 Method 已定義好而整個文件完成後才會執行，算是閉包的一種
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      // 從 company 連回 users 關聯時會是複數
      // 一間公司會有許多 users，所以使用 new GraphQLList 來接
      type: new GraphQLList(UserType),
      async resolve(parseValue, args){
        const { data } = await axios(`http://localhost:3000/companies/${parseValue.id}/users`)
        return data
      }
    }
  })
})

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
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
  })
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

// mutation
// 對 GraphQL 做一些操作，新增、刪除、更新之類的
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      // return UserType object
      type: UserType,
      // 指定以下的 args
      args: {
        // new graphQLNonNull = required
        // 一定要帶值的 args，這裡表示在呼叫 addUser 時的 firstName & age 是必需要提供的
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      // 第二個參數是以上面 args 所定的 attribute
      async resolve(parseValue, { firstName, age }){
        const { data } = await axios.post('http://localhost:3000/users', { firstName, age })
        return data
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      async resolve(parseValue, { id }){
        const { data } = await axios.delete(`http://localhost:3000/users/${id}`)
        return data
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      async resolve(parseValue, args){
        const { data } = await axios.patch(`http://localhost:3000/users/${args.id}`, args)
        return data
      }
    }
  }
})

module.exports = new GraphQLSchema({ query: RootQuery, mutation })