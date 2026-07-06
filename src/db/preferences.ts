import AsyncStorage from "@react-native-async-storage/async-storage";

const getPreferences = async () => {
    const result = await AsyncStorage.getItem("preferences")
    if (result) {
        return JSON.parse(result)
    }
    return {
        theme: "system",
    }
}

const setPreferences = async (preferences: { theme: "light" | "dark" | "system", aiProvider: "gemini" }) => {
    await AsyncStorage.setItem("preferences", JSON.stringify(preferences))
}

const deletePreferences = async()=>{
    try {
        await AsyncStorage.removeItem("preferences")
    } catch (error) {
        console.error(error)
    }
}

export default {
    getPreferences,
    setPreferences,
    deletePreferences
}