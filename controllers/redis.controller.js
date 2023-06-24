const {
    getData,
    setData,
    getAllKeys,
    pushData,
    getListData,
    deleteData,
    getSetData,
} = require("../cache")


module.exports = {
    // @GET
    GetAllKeys: async (req, res, next) => {
        try {
            res.send(await getAllKeys())
        } catch (error) {
            next(error)
        }
    },
    // @POST
    SetData: async (req, res, next) => {
        try {
            res.send(await setData(req.body.key, req.body.value))
        } catch (error) {
            next(error)
        }
    },
    // @POST
    PushData: async (req, res, next) => {
        try {
            res.send(await pushData(req.body.key, req.body.value))
        } catch (error) {
            next(error)
        }
    },
    // @GET
    GetData: async (req, res, next) => {
        try {
            res.send(await getData(req.params.key))
        } catch (error) {
            next(error)
        }
    },
    // @GET
    GetSetData: async (req, res, next) => {
        try {
            res.send(await getSetData(req.params.key))
        } catch (error) {
            next(error)
        }
    },
    // @GET
    GetListData: async (req, res, next) => {
        try {
            const { key, start, stop } = req.params;
            res.send(await getListData(key, start, stop))
        } catch (error) {
            next(error)
        }
    },
    // @DELETE
    DeleteData: async (req, res, next) => {
        try {
            res.send(await deleteData(req.params.key))
        } catch (error) {
            next(error)
        }
    },
};